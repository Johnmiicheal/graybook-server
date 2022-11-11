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

import { AdminResponse, GrayCaseResponse, MyContext, SchoolResponse, StudentResponse } from "../types";
import { School } from "../entities/School";
import { Student } from "../entities/Student";
import { Admin } from "../entities/Admin";
import { GrayCase } from "../entities/GrayCase";
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

  @FieldResolver(() => GrayCaseResponse)
  async studentCase(
    @Root() student: Student,
    @Ctx() { em, req }: MyContext
  ): Promise<GrayCaseResponse>{
    const grayCase = await em.fork({}).findOne(GrayCase, { defaulter: student }, { populate: [
      "defaulter",
      "category",
      "owner"
    ]});
    if (grayCase) {
      return { grayCase };
    } else {
      return { 
        errors: [
          {
            field: "Case not found.",
            message: "Case could not be fetched"
          }
        ]
      }
    }
  }

  @Query(() => Number)
  async getCaseCount(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<Number>{
    const student = await em.fork({}).findOne(Student, { id: id }, { populate:[
      "defaults"
    ]});
    if( student ){
      return student.defaults.count();
    }else {
      return 0
    }
  }

  @FieldResolver(() => String)
  async parentName(@Root() student: Student, @Ctx() { em, req }: MyContext) {
   return student.parentName
  }

  @FieldResolver(() => String)
  async profileImgUrl(@Root() student: Student, @Ctx() { em, req }: MyContext) {
   return student.profileImgUrl
  }

  @FieldResolver(() => String)
  async parentEmail(@Root() student: Student, @Ctx() { em, req }: MyContext) {
   return student.parentEmail
  }

  @FieldResolver(() => String)
  async parentNumber(@Root() student: Student, @Ctx() { em, req }: MyContext) {
   return student.parentNumber
  }

  @FieldResolver(() => String)
  async homeAddress(@Root() student: Student, @Ctx() { em, req }: MyContext) {
   return student.homeAddress
  }
  @FieldResolver(() => String)
  async state(@Root() student: Student, @Ctx() { em, req }: MyContext) {
   return student.state
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
    @Arg("schoolId") schoolId: string,
    @Ctx() { em, req }: MyContext
  ): Promise<Student[]> {
    const school = await em
      .fork({})
      .findOne(School, { schoolName: schoolId }, { populate: ["members"] });
    if (school) {
      const students = school.members.getItems();
      return students;
    }
    return [];
  }

  @Query(() => [Student])
  @UseMiddleware(isAuth)
  async getStudentFromClass(
    @Arg("gradeClass") gradeClass: string,
    @Ctx() { em, req }: MyContext
  ): Promise<Student[]> {
    const admin = await em.fork({}).findOne(Admin, { id: req.session.userid})
    const student = await em
      .fork({})
      .find(Student, { gradeClass: gradeClass, admin: admin });
    if (student) {
      return student;
    }
    return [];
  }

  @Query(() => Number)
  async getClassCount(
    @Arg("gradeClass") gradeClass: string,
    @Ctx() { em, req } : MyContext
  ): Promise<Number> {
    // const admin = await em.fork({}).findOne(Admin, { id: req.session.userid })
    const student = await em.fork({}).find(Student, { gradeClass: gradeClass })
    if(student){
      return student.length
    }
    return 0
  }


  @Query(() => StudentResponse)
  // @UseMiddleware(isAuth)
  async getStudentById(
    @Arg("id") id: number,
    @Ctx() { em, req }: MyContext
  ): Promise<StudentResponse> {
    const student = await em.fork({}).findOne(Student, { id: id });
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
    @Arg("gradeClass") gradeClass: string,
    @Arg("gender") gender: string,
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
        gradeClass,
        gender,
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
    @Arg("lastName") lastName: string,
    @Arg("gradeClass") gradeClass: string,
    @Arg("gender") gender: string,
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
