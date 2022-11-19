import {
  Resolver,
  Ctx,
  Query,
  Arg,
  UseMiddleware,
  Mutation,
  FieldResolver,
  Root
} from "type-graphql";

import { SchoolResponse, MyContext, AdminResponse } from "../types";
import { School } from "../entities/School";
import { Admin } from "../entities/Admin";
import { QueryOrder } from "@mikro-orm/core";
import { isAuth } from "../middleware/isAuth";
import { validateSchool } from "../utils/validateSchool";
import { Student } from "../entities/Student";
import { GrayCase } from "../entities/GrayCase";
// import { Student } from "../entities/Student";
// import session from "express-session";

@Resolver(School)
export class SchoolResolver {

  @FieldResolver(() => AdminResponse, {nullable: true})
  async creator(@Root() school: School, @Ctx() { em, req }: MyContext)
  : Promise<AdminResponse> {
    try{
      const admin = await em.fork({}).findOne(Admin, {id: school.creator.id}, 
        {populate: ["adminName", "email", "createdAt", "phoneNumber", "profileImgUrl", "id", "school" ]});
  
        if (admin){
          return {
            admin,
          }
        } else{
          return {
            errors: [
              {
                field: "Error occured while fetching admin.",
                message: `Admin could not be fetched`,
              },
            ],
          };
  
        }
      } catch (err){
        return {
            errors: [
              {
                field: "Error occured while fetching admin.",
                message: err,
              },
            ],
        };
  
      }
  }
  
  @Query(() => [School])
  async getSchools(@Ctx() { em }: MyContext): Promise<School[]> {
    const schools = await em
      .fork({})
      .find(School, {}, { orderBy: { schoolName: QueryOrder.DESC } });
    return schools;
  }

  @Query(() => SchoolResponse)
  async getSchoolByName(
    @Arg("schoolName") schoolName: string,
    // @Arg("universityName") universityName: string,
    @Ctx() { em, req }: MyContext
  ): Promise<SchoolResponse> {
    try {
      const school = await em
        .fork({})
        .findOneOrFail(School, { schoolName: schoolName });
      if (school) {
        return {
          school,
        };
      } else {
        return {
          errors: [
            {
              field: "Error occured while fetching school.",
              message: `School with name: ${schoolName} could not be fetched`,
            },
          ],
        };
      }
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

  // @Query(() => [Group])
  // async topschools(@Ctx() {em}: MyContext) :
  // Promise<Group[]>{
  //   const topschools = await em.fork({}).find(Group, {}, {orderBy: {members: QueryOrder.DESC}, limit: 5 });
  //   return topschools;
  // }

  @Query(() => Number)
  async getSchoolStudentsCount(
    @Arg("schoolId") schoolId: number,
    @Ctx() { em }: MyContext
  ): Promise<number> {
    const student = await em
      .fork({})
      .findOne(School, { id: schoolId }, { populate: ["members"] });
    if (student) {
      return student.members.count();
    }
    return -1;
  }

  @Mutation(() => SchoolResponse)
  @UseMiddleware(isAuth)
  async registerSchool(
    @Arg("schoolName") schoolName: string,
    @Arg("rcnumber") rcnumber: number,
    @Arg("address") address: string,
    @Arg("state") state: string,
    @Arg("country") country: string,
    @Arg("logoImgUrl") logoImgUrl: string,
    //we can make it optional to create with logo and banner images
    @Ctx() { em, req }: MyContext
  ): Promise<SchoolResponse> {
    const errors = validateSchool(schoolName, address);
    if (errors) {
      return { errors };
    }

    const admin = await em.fork({}).findOne(Admin, { id: req.session.userid });
    try {
      try {
        if (admin) {
          const school = new School(
            schoolName,
            rcnumber,
            address,
            state,
            country,
            logoImgUrl,
            admin
          );
          await em.fork({}).persistAndFlush(school);
          return { school };
        } else {
          return {
            errors: [
              {
                field: "Error registering school.",
                message: "User with session id could not be fetched.",
              },
            ],
          };
        }
      } catch (err) {
        if (err.code === "23505") {
          return {
            errors: [
              {
                field: "schoolName",
                message: "School Name already taken",
              },
            ],
          };
        } else {
          return {
            errors: [
              {
                field: "Could not create school",
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
            field: "Error occured in school registration.",
            message: err,
          },
        ],
      };
    }
  }

  @Query(() => [Student])
  @UseMiddleware(isAuth)
  async getAdminStudents(@Ctx() { em, req }: MyContext): Promise<Student[]> {
    const admin = await em
      .fork({})
      .findOne(Admin, { id: req.session.userid }, { populate: ["student"] });

    if (admin) {
      const students = admin.student.getItems();
      return students;
    }
    return [];
  }

  @Query(() => [GrayCase])
  @UseMiddleware(isAuth)
  async getAdminGrayCases(@Ctx() { em, req }: MyContext): Promise<GrayCase[]> {
    const admin = await em
      .fork({})
      .findOne(Admin, { id: req.session.userid }, { populate: ["grayCase"] });

    if (admin) {
      const grayCase = admin.grayCase.getItems();
      return grayCase;
    }
    return [];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async updateSchoolDetails(
    @Arg("schoolId") schoolId: number,
    @Arg("schoolName") schoolName: string,
    @Arg("rcnumber") rcnumber: number,
    @Arg("address") address: string,
    @Arg("state") state: string,
    @Arg("country") country: string,
    @Arg("logoImgUrl", { nullable: true }) logoImgUrl: string,
    @Arg("bannerImgUrl", { nullable: true }) bannerImgUrl: string,
    @Ctx() { em, req }: MyContext
  ): Promise<boolean> {
    const admin = await em.fork({}).findOne(Admin, { id: req.session.userid });
    const school = await em.fork({}).findOne(School, { id: schoolId });

    if (admin && school) {
      //check if creator
      if (req.session.userid === admin.id) {
        //alter details
        school.schoolName = schoolName ? schoolName : school.schoolName;
        school.rcnumber = rcnumber ? rcnumber : school.rcnumber;
        school.address = address ? address : school.address;
        school.state = state ? state : school.state;
        school.country = country ? country : school.country;
        school.logoImgUrl = logoImgUrl ? logoImgUrl : school.logoImgUrl;
        school.bannerImgUrl = bannerImgUrl ? bannerImgUrl : school.bannerImgUrl;
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}
