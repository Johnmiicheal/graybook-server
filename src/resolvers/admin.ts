import {
  Resolver,
  Mutation,
  Arg,
  Ctx,
  Query,
  FieldResolver,
  Root,
} from "type-graphql";
import { QueryOrder } from "@mikro-orm/core";

import { MyContext } from "../types";
import { Admin } from "../entities/Admin";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX, HTML_LINK } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateNewPass, validateRegister } from "../utils/validateRegister";
import { AdminResponse } from "../types";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

@Resolver(Admin) 
export class AdminResolver {
  @FieldResolver(() => String)
  adminName(@Root() admin: Admin, @Ctx() { req }: MyContext) {
    if (req.session.userid === admin.id) {
      return admin.adminName;
    }
    return "";
  }

/** Change Password */
  @Mutation(() => AdminResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, em, req }: MyContext
  ): Promise<AdminResponse> {
    const errors = validateNewPass(newPassword);
    if (errors) {
      return { errors };
    }
    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }

    const admin = await em.fork({}).findOne(Admin, { id: parseInt(userId) });
    if (!admin) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    admin.passwordHash = await argon2.hash(newPassword);
    await em.fork({}).persistAndFlush(admin);

    await redis.del(key);

    //login user on password change [success]
    req.session.userid = admin.id;
    return { admin };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { em, redis }: MyContext
  ) {
    const admin = await em.fork({}).findOne(Admin, { email });
    if (!admin) {
      // the email is not in db
      return true;
    }
    const token = v4();
    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      admin.id,
      "EX",
      1000 * 60 * 60 * 24
    );
    await sendEmail(email, HTML_LINK);
    return true;
  }

  @Query(() => AdminResponse, { nullable: true })
  async admin(
    @Arg("adminName") adminName: string,
    @Ctx() { em, req }: MyContext
  ): Promise<AdminResponse | undefined> {
    try {
      const admin = await em.fork({}).findOneOrFail(Admin, { adminName: adminName });
      return{
        admin
      };
    } catch (err) {
      return {
        errors: [
          {
            field: "Error occured while fetching user.",
            message: err,
          },
        ],
      };
    }
  }

  @Query(() => AdminResponse, { nullable: true })
  async me(@Ctx() { em, req }: MyContext): Promise<AdminResponse> {
    if (!req.session.userid) {
      return {
        errors: [
          {
            field: "User not logged in",
            message: "Cannot fetch user data because no user is logged in.",
          },
        ],
      };
    }
    try {
      const admin = await em
        .fork({})
        .findOneOrFail(Admin, { id: req.session.userid });
      return {
        admin,
      };
    } catch (err) {
      return {
        errors: [
          {
            field: "Error occured while fetching user.",
            message: err,
          },
        ],
      };
    }
  }


  @Mutation(() => AdminResponse)
  async registerAdmin(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<AdminResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);
    // let School = getSchool(options.email);

    try {
          try {
            const admin = new Admin(
              options.adminName,
              options.phoneNumber,
              options.email,
              hashedPassword
            );
            await em.fork({}).persistAndFlush(admin);

            // uni.students.add(user);
            // em.fork({}).persistAndFlush(uni);

            // user = await em.fork({}).getRepository(User).findOneOrFail({})
            req.session.userid = admin.id;
            return { admin };
          } catch (err) {
            if (err.code === "23505") {
              return {
                errors: [
                  {
                    field: "adminName",
                    message: "Admin Name already taken",
                  },
                ],
              };
            } else {
              return {
                errors: [
                  {
                    field: "Could not create user",
                    message: err.message,
                  },
                ],
              };
            }
          }
      } catch (err) {
      return {
        errors: [
          {
            field: "Error occured in user creation.",
            message: err,
          },
        ],
      };
    }
  }

  @Mutation(() => AdminResponse)
  async loginAdmin(
    @Arg("adminNameOrEmail") adminNameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<AdminResponse> {
    try {
      const admin = await em
        .fork({})
        .findOneOrFail(
          Admin,
          adminNameOrEmail.includes("@")
            ? { email: adminNameOrEmail }
            : { adminName: adminNameOrEmail }
        );

      const valid = await argon2.verify(admin.passwordHash, password);
      if (!valid) {
        return {
          errors: [
            {
              field: "password",
              message: "incorrect password",
            },
          ],
        };
      }

      req.session.userid = admin.id;

      return {
        admin,
      };
    } catch (e) {
      return {
        errors: [
          {
            field: "adminNameOrEmail",
            message: "Username or Email does not exist",
          },
        ],
      };
    }
  }

  @Mutation(() => Boolean)
  logoutUser(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err: any) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }

  @Query(() => [Admin])
  async getAdmins(@Ctx() {em}: MyContext) : 
  Promise<Admin[]>{
    const admin= await em.fork({}).find(Admin, {}, {orderBy: {adminName: QueryOrder.DESC} });
    return admin;
  }

}
