import {
  Resolver,
  Mutation,
  Arg,
  Ctx,
  Query,
  FieldResolver,
  Root,
  UseMiddleware,
  Int,
} from "type-graphql";

import { MyContext } from "../types";
import { GrayCase } from "../entities/GrayCase";
import { isAuth } from "../middleware/isAuth";
import { Admin } from "../entities/Admin";
import { AdminResponse, GrayCaseResponse, PaginatedGrayCase } from "../types";
import { QueryOrder } from "@mikro-orm/core";
import { Student } from "../entities/Student";

@Resolver(GrayCase)
export class GrayCaseResolver {
  @FieldResolver(() => AdminResponse)
  async creator(
    @Root() grayCase: GrayCase,
    @Ctx() { em }: MyContext
  ): Promise<AdminResponse> {
    const admin = await em.fork({}).findOne(Admin, { id: grayCase.owner.id });
    if (admin) {
      return { admin };
    } else {
      return {
        errors: [
          {
            field: "User not found.",
            message: "User could not be fetched.",
          },
        ],
      };
    }
  }

  @Query(() => GrayCaseResponse)
  async getGrayCase(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<GrayCaseResponse> {
    const grayCase = await em
      .fork({})
      .findOne(
        GrayCase,
        { id: id },
        {
          populate: [
            "category",
            "id",
            "createdAt",
            "updatedAt",
            "wasEdited",
            "owner",
            "owner.id",
            "firstName",
            "lastName",
            "ageInput",
            "gender",
            "gradeClass",
            "school",
          ],
        }
      );
    if (grayCase) {
      return { grayCase };
    } else {
      return {
        errors: [
          {
            field: "Error in fetching gray case.",
            message: "Cases could not be fetched.",
          },
        ],
      };
    }
  }

  @Query(() => PaginatedGrayCase)
  @UseMiddleware(isAuth)
  async schoolCases(
    @Arg("limit") limit: number,
    @Arg("cursor", { defaultValue: 0 }) cursor: number,
    @Arg("sortBy", () => String, { nullable: true }) sortBy: string | null,
    @Ctx() { em, req }: MyContext
  ): Promise<PaginatedGrayCase> {
    cursor = cursor === null ? 0 : cursor;
    sortBy = sortBy === null ? "recent" : sortBy;

    const admin = await em
      .fork({})
      .findOne(
        Admin,
        { id: req.session.userid},
        { populate: ["grayCase", "grayCase.school"] }
      );
      
    if (admin) {
      const maxLimit: number = 50;
      limit = Math.min(maxLimit, limit);

      const endIndex = cursor + limit;
      const posts = admin.grayCase.getItems();
      if(endIndex > posts.length){
        return {
          grayCase : posts.slice(cursor),
          hasMore: false,
          cursor: posts.length-1
        }
      }else{
        return{
          grayCase: posts.slice(cursor, cursor+limit),
          hasMore: false,
          cursor: cursor+limit
        }
      }

    } else {
      return {
        grayCase: [],
        hasMore: false,
        cursor: -1,
      };
    }
  }

  // @Query(() => PaginatedGrayCase)
  // @UseMiddleware(isAuth)
  // async homePosts(
  //   @Arg("limit") limit: number,
  //   @Arg("cursor", { defaultValue: 0 }) cursor: number,
  //   @Arg("sortBy", () => String, { nullable: true }) sortBy: string | null,
  //   @Ctx() { em, req }: MyContext
  // ): Promise<PaginatedGrayCase> {
  //   cursor = cursor === null ? 0 : cursor;
  //   sortBy = sortBy === null ? "recent" : sortBy;

  //   const user = await em
  //     .fork({})
  //     .findOne(
  //       User,
  //       { id: req.session.userid },
  //       { populate: ["subscriptions"] }
  //     );
  //   if (user) {
  //     await user.subscriptions.init();
  //     const schools = user.subscriptions.getItems();

  //     if (schools) {
  //       const maxLimit: number = 50;
  //       limit = Math.min(maxLimit, limit);

  //       if (sortBy === "recent") {
  //         const time_period = new Date(
  //           new Date().getTime() - 1000 * 60 * 60 * 24 * 10
  //         );
  //         const [posts, count] = await em
  //           .fork({})
  //           .findAndCount(
  //             Post,
  //             { createdAt: { $gt: time_period }, school: { $in: schools } },
  //             {
  //               limit: limit,
  //               populate: [
  //                 // "votes",
  //                 "savers",
  //                 "category",
  //                 "body",
  //                 "id",
  //                 "createdAt",
  //                 "updatedAt",
  //                 "wasEdited",
  //                 "voteCount",
  //                 "school",
  //                 "owner",
  //                 "owner.id",
  //               ],
  //               offset: cursor,
  //               orderBy: { voteCount: QueryOrder.DESC },
  //             }
  //           );
  //           console.log(schools);
  //           return {
  //           posts: posts,
  //           hasMore: limit + cursor + 1 < count,
  //           cursor: cursor + limit + 1,
  //         };
  //       } else {
  //         // (sortBy === "new")
  //         const time_period = new Date(
  //           new Date().getTime() - 1000 * 60 * 60 * 24 * 2
  //         );
  //         const [posts, count] = await em
  //           .fork({})
  //           .findAndCount(
  //             Post,
  //             { createdAt: { $gt: time_period }, school: { $in: schools } },
  //             {
  //               limit: limit,
  //               populate: [
  //                 // "votes",
  //                 "savers",
  //                 "category",
  //                 "body",
  //                 "id",
  //                 "createdAt",
  //                 "updatedAt",
  //                 "wasEdited",
  //                 "voteCount",
  //                 "school",
  //                 "owner",
  //                 "owner.id",
  //               ],
  //               offset: cursor,
  //               orderBy: { createdAt: QueryOrder.DESC },
  //             }
  //           );
  //         console.log(schools);

  //         return {
  //           posts: posts || [],
  //           hasMore: limit + cursor + 1 < count,
  //           cursor: cursor + limit + 1,
  //         };
  //       }
  //     } else {
  //       return {
  //         posts: [],
  //         hasMore: false,
  //         cursor: -1,
  //       };
  //     }
  //   } else {
  //     return {
  //       posts: [],
  //       hasMore: false,
  //       cursor: -1,
  //     };
  //   }
  // }


  @Query(() => PaginatedGrayCase)
  async trendingCases(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => Int) cursor: number | null,
    @Arg("sortBy", () => String, { nullable: true }) sortBy: string | null,
    @Ctx() { em, req }: MyContext
  ): Promise<PaginatedGrayCase> {
    cursor = cursor === null ? 0 : cursor;
    sortBy = sortBy === null ? "recent" : sortBy;

    const maxLimit: number = 50;
    limit = Math.min(maxLimit, limit);

    if (sortBy === "best") {
      const time_period = new Date(
        new Date().getTime() - 1000 * 60 * 60 * 24 * 20
      );
      const [posts, count] = await em.fork({}).findAndCount(
        GrayCase,
        { createdAt: { $gt: time_period } },
        {
          limit: limit,
          offset: cursor,
          populate: [
            "category",
            "id",
            "createdAt",
            "updatedAt",
            "wasEdited",
            "owner",
            "owner.id",
            "firstName",
            "lastName",
            "ageInput",
            "gender",
            "gradeClass",
            "school",
          ],
          orderBy: { createdAt: QueryOrder.DESC },
        }
      );

      return {
        grayCase: posts,
        hasMore: limit + cursor + 1 < count,
        cursor: cursor + limit + 1,
      };
    } else {
      // sortBy === "recent"
      const [posts, count] = await em
        .fork({})
        .findAndCount(
          GrayCase,
          {},
          {
            limit: limit,
            offset: cursor,
            populate: [
              "category",
              "id",
              "createdAt",
              "updatedAt",
              "wasEdited",
              "owner",
              "owner.id",
              "firstName",
              "lastName",
              "ageInput",
              "gender",
              "gradeClass",
              "school",
            ],
          }
        );

      return {
        grayCase: posts,
        hasMore: limit + cursor + 1 < count,
        cursor: cursor + limit + 1,
      };
    }
  }

  @Mutation(() => GrayCaseResponse)
  @UseMiddleware(isAuth)
  async createNewGrayCase(
    @Arg("category") category: string,
    @Arg("firstName") firstName: string,
    @Arg("lastName") lastName: string,
    @Arg("gender") gender: string,
    @Arg("gradeClass") gradeClass: string,
    @Arg("ageInput") ageInput: number,
    @Ctx() { em, req }: MyContext
  ): Promise<GrayCaseResponse> {
    const admin = await em.fork({}).findOne(Admin, { id: req.session.userid });

    if (admin) {
      // Basically, the Admin is an extension of the School...
      const grayCase = new GrayCase(admin, category, firstName, lastName, gradeClass, gender, ageInput);
      admin.grayCase.add(grayCase);
      await em.fork({}).persistAndFlush(grayCase);
      return { grayCase };
    } else {
      return {
        errors: [
          {
            field: "Error in fetching user.",
            message: "User with session id could not be fetched.",
          },
        ],
      };
    }
  }

  @Mutation(() => GrayCaseResponse)
  @UseMiddleware(isAuth)
  async addGrayCase(
    @Arg("category") category: string,
    @Arg("studentId") studentId: number,
    @Ctx() { em, req }: MyContext
  ): Promise<GrayCaseResponse> {
    const admin = await em.fork({}).findOne(Admin, { id: req.session.userid });
    const student = await em.fork({}).findOne(Student, { id: studentId });

    if (admin && student) {
      const grayCase = new GrayCase(admin, category, student?.firstName!, student?.lastName!, student?.gradeClass!, student?.gender!, student?.ageInput!);
      student.defaults.add(grayCase);
      grayCase.defaulter.add(student)
      await em.fork({}).persistAndFlush(grayCase);
      return { grayCase };
    } else {
      return {
        errors: [
          {
            field: "Error in fetching user.",
            message: "User with session id could not be fetched.",
          },
        ],
      };
    }
  }

  @Mutation(() => GrayCaseResponse)
  @UseMiddleware(isAuth)
  async updateGrayCase(
    @Arg("id", () => Int) id: number,
    @Arg("category") category: string,
    @Arg("firstName") firstName: string,
    @Arg("lastName") lastName: string,
    @Arg("gender") gender: string,
    @Arg("gradeClass") gradeClass: string,
    @Arg("ageInput") ageInput: number,
    @Ctx() { em }: MyContext
  ): Promise<GrayCaseResponse> {
    const grayCase = await em.fork({}).findOne(GrayCase, { id });
    if (grayCase) {
      if (category || firstName || lastName || gender || gradeClass || ageInput) {
        grayCase.category = category;
        grayCase.firstName = firstName;
        grayCase.lastName = lastName;
        grayCase.gender = gender;
        grayCase.gradeClass = gradeClass;
        grayCase.ageInput = ageInput;
      }
      grayCase.wasEdited = true;

      await em.fork({}).persistAndFlush(grayCase);
      return { grayCase };
    } else {
      return {
        errors: [
          {
            field: "Error in fetching case.",
            message: "GrayCase with id could not be fetched.",
          },
        ],
      };
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteGrayCase(
    @Arg("id") id: number,
    @Ctx() { em, req }: MyContext
  ): Promise<boolean> {
    let isAuth = false;
    const grayCase = await em.fork({}).findOne(GrayCase, { id }, { populate: ["school"]});
    if (grayCase) {
      if (grayCase.owner.id === req.session.userid) {
        isAuth = true;
      }
      
      if (isAuth) {
        await em.fork({}).nativeDelete(GrayCase, { id });
        return true;
      }
    }
    return false;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async archiveGrayCase(
    @Arg("id", () => Int) id: number,
    @Ctx() { em, req }: MyContext
  ): Promise<Boolean> {
    const user = await em.fork({}).findOne(Admin, { id: req.session.userid });
    const post = await em
      .fork({})
      .findOne(GrayCase, { id }, { populate: ["archived"] });
    if (user && post) {
      user.archivedGrayCase.add(post);
      post.archived.add(user);
      em.fork({}).persistAndFlush(user);
      return true;
    } else {
      return false;
    }
  }
  
  @Query(() => Number)
  async getStudentCaseCount(
    @Arg("id") id: number,
    @Ctx() { em, req }: MyContext
  ): Promise<Number> {
    const student = await em.fork({}).findOne(Student, { id: id })
    const grayed = await em.fork({}).findOne(GrayCase, {defaulter: student })
    if( student && grayed ){
      return student.defaults.count()
    }
    else{
      return 0
    }
  }

}

