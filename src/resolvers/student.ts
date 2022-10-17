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

import { MyContext, StudentResponse } from "../types";
import { School } from "../entities/School";
import { Student } from "../entities/Student";
import { Admin } from "../entities/Admin";
import { QueryOrder } from "@mikro-orm/core";
import { isAuth } from "../middleware/isAuth";
// import session from "express-session";

@Resolver(Student)
export class Studentresolver {
  @FieldResolver(() => StudentResponse)
  async student(
    @Root() student: Student,
    @Ctx() { em, req }: MyContext
  ): Promise<StudentResponse> {
    try {
      const admin = await em
        .fork({})
        .findOneOrFail(
          Admin,
          { id: req.session.userid },
          { populate: ["student"] }
        );
      const student = await em
        .fork({})
        .findOneOrFail(
          Student,
          { id: admin.student.id },
          {
            populate: [
              "firstName",
              "lastName",
              "ageInput",
              "gender",
              "gradeClass",
              "profileImgUrl",
              "enrolled",
            ],
          }
        );
      if (student) {
        return {
          student,
        };
      } else {
        return {
          errors: [
            {
              field: "Error occured while fetching university.",
              message: `University with id could not be fetched`,
            },
          ],
        };
      }
    } catch (err) {
      return {
        errors: [
          {
            field: "Error occured while fetching university.",
            message: `University with id ${student.id} could not be fetched`,
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
  async getGroupByName(
    @Arg("firstName") firstName: string,
    @Ctx() { em, req }: MyContext
  ): Promise<StudentResponse> {
    try {
      const student = await em
        .fork({})
        .findOneOrFail(Student, { firstName: firstName });
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
    const school = await em.fork({}).findOne(School, { id: schoolId }, { populate: ["members"]})
    if(school){
      const students = school.members.getItems()
      return students
    }
    return []    
  }

  @Mutation(() => StudentResponse)
  @UseMiddleware(isAuth)
  async registerStudent(
    @Arg("firstName") firstName: string,
    @Arg("lastName") lastName: string,
    @Arg("gender") gender: string,
    @Arg("gradeClass") gradeClass: string,
    @Arg("ageInput") ageInput: number,
    @Arg("birthDay") birthDay: string,
    @Arg("birthMonth") birthMonth: string,
    @Arg("birthYear") birthYear: string,
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
      .findOne(Admin, { id: req.session.userid }, { populate: ["student"] });
    const school = await em.fork({}).findOne(School, { id: admin?.school.id }, { populate: ["members"]})

    if (admin) {
      const student = new Student(
        firstName,
        lastName,
        gender,
        gradeClass,
        ageInput,
        birthDay,
        birthMonth,
        birthYear,
        parentName,
        parentNumber,
        parentEmail,
        homeAddress,
        state,
        lgaOrigin,
        academicResult,
        profileImgUrl
      );
      school?.members.add(student) 
      await em.fork({}).persistAndFlush(student);
      await em.fork({}).persistAndFlush(admin);
      student.enrolled.add(school!) 
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
