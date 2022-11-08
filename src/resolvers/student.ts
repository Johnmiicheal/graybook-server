import {
  Resolver,
  Ctx,
  Query,
  Arg,
  UseMiddleware,
  Mutation,
  FieldResolver,
  Root,
} from "type-graphql";

import { AdminResponse, MyContext, SchoolResponse, StudentResponse } from "../types";
import { School } from "../entities/School";
import { Student } from "../entities/Student";
import { Admin } from "../entities/Admin";
import { QueryOrder } from "@mikro-orm/core";
import { isAuth } from "../middleware/isAuth";
// import session from "express-session";

@Resolver(Student)
export class StudentResolver {
  @FieldResolver(() => SchoolResponse)
  async school(@Root() student: Student, @Ctx() { em, req }: MyContext
  ): Promise<SchoolResponse>{
    const school = await em.fork({}).findOne(School, { id: student.school.id });
    if (school) {
      return { school };
    } else {
      return{
        errors: [
          {
            field: "School not found",
            message: "School could not be fetched"
          }
        ]
      }
    }
  }
  
  @FieldResolver(() => AdminResponse)
  async creator(
    @Root() student: Student,
    @Ctx() { em, req }: MyContext
  ): Promise<AdminResponse> {
    const admin = await em.fork({}).findOne(Admin, { id: student.admin.id });
    if (admin) {
      return { admin };
    } else {
      return {
        errors: [
          {
            field: "Admin not found.",
            message: "Admin could not be fetched.",
          },
        ],
      };
    }
  }

  @Query(() => [Student])
  async getStudent(@Ctx() { em }: MyContext): Promise<Student[]> {
    const students = await em
      .fork({})
      .find(Student, {}, { orderBy: { firstName: QueryOrder.DESC } });
    return students;
  }

  @Query(() => StudentResponse)
  async getStudentByName(
    @Arg("firstName") firstName: string,
    @Ctx() { em, req }: MyContext
  ): Promise<StudentResponse> {
    try {
      const student = await em
        .fork({})
        .findOne(Student, { firstName: firstName }, {
          populate: [
            "academicResult",
            "admin",
            "admin.id",
            "school",
            "school.id",
            "ageInput",
            "birthDate",
            "createdAt",
            "defaults",
            "enrolled",
            "firstName",
            "gender",
            "gradeClass",
            "homeAddress",
            "id",
            "lastName",
            "parentName"
          ]
        });
      if (student) {
        return {
          student,
        };
      } else {
        return {
          errors: [
            {
              field: "Error occured while fetching student.",
              message: `Student with name: ${firstName} could not be fetched`,
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

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async transferStudent(
    @Arg("studentId") studentId: number,
    @Arg("schoolId") schoolId: number,
    @Ctx() { em, req }: MyContext
  ): Promise<boolean> {
    const admin = await em.fork({}).findOne(Admin, { id: req.session.userid });
    const student = await em.fork({}).findOne(Student, { id: studentId });
    const school = await em.fork({}).findOne(School, { id: schoolId });

    if (admin && school && student) {
      student?.enrolled.add(school);
      school.members.add(student!);
      await em.fork({}).persistAndFlush(student!);
      await em.fork({}).persistAndFlush(school);
      return true;
    }
    return false;
  }

  @Query(() => [Student])
  async getStudentFromSchool(
    @Arg("schoolId") schoolId: number,
    @Ctx() { em, req }: MyContext
  ): Promise<Student[]> {
    const school = await em
      .fork({})
      .findOne(School, { id: schoolId }, { populate: ["members"] });
    if (school) {
      const students = school.members.getItems();
      return students;
    }
    return [];
  }

  @Query(() => StudentResponse)
  // @UseMiddleware(isAuth)
  async getStudentByClass(
    @Arg("gradeClass") gradeClass: string,
    @Ctx() { em, req }: MyContext
  ): Promise<StudentResponse> {
    // const admin = await em.fork({}).findOneOrFail(Admin, {id: req.session.userid }, {populate: ["school", "student"]});
    // const school = await em.fork({}).findOneOrFail(School, { creator: admin }, { populate: ["members"]});
    const student = await em.fork({}).findOne(Student, { gradeClass: gradeClass });
    if (student) {
      return{ student }
    } else {
      return {
        errors: [
          {
            field: "No Students found",
            message: "No Student data available"
          }
        ]
      }
    }
  }

  @Mutation(() => StudentResponse)
  @UseMiddleware(isAuth)
  async registerStudent(
    @Arg("firstName") firstName: string,
    @Arg("lastName") lastName: string,
    @Arg("gender") gender: string,
    @Arg("gradeClass") gradeClass: string,
    @Arg("ageInput") ageInput: number,
    @Arg("birthDate") birthDate: Date,
    @Arg("parentName") parentName: string,
    @Arg("parentNumber") parentNumber: string,
    @Arg("parentEmail") parentEmail: string,
    @Arg("homeAddress") homeAddress: string,
    @Arg("state") state: string,
    @Arg("lgaOrigin") lgaOrigin: string,
    @Arg("academicResult") academicResult: string,
    @Arg("profileImgUrl") profileImgUrl: string,
    //we can make it optional to create with logo and banner images
    @Ctx() { em, req }: MyContext
  ): Promise<StudentResponse> {
    const admin = await em
      .fork({})
      .findOne(
        Admin,
        { id: req.session.userid });
    const school = await em.fork({}).findOne(School, { creator: admin });
    if (admin && school) {
      const student = new Student(
        firstName,
        lastName,
        gender,
        gradeClass,
        ageInput,
        birthDate,
        parentName,
        parentNumber,
        parentEmail,
        homeAddress,
        state,
        lgaOrigin,
        academicResult,
        profileImgUrl,
        admin,
        school
      );
      school.members.add(student);
      await em.fork({}).persistAndFlush(student);
      return { student };
    } else {
      return {
        errors: [
          {
            field: "Error registering student.",
            message: "User with session id could not be fetched.",
          },
        ],
      };
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async updateStudentDetails(
    @Arg("studentId") studentId: number,
    @Arg("firstName") firstName: string,
    @Arg("rcnumber") rcnumber: number,
    @Arg("address") address: string,
    @Arg("state") state: string,
    @Arg("country") country: string,
    @Arg("logoImgUrl", { nullable: true }) logoImgUrl: string,
    @Arg("bannerImgUrl", { nullable: true }) bannerImgUrl: string,
    @Ctx() { em, req }: MyContext
  ): Promise<boolean> {
    const admin = await em.fork({}).findOne(Admin, { id: req.session.userid });
    const student = await em.fork({}).findOne(Student, { id: studentId });

    if (admin && student) {
      //check if creator
      if (student.admin.id === req.session.userid) {
        //alter details
        student.firstName = firstName ? firstName : student.firstName;
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}
