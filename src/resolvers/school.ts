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

import { SchoolResponse, MyContext } from "../types";
import { School } from "../entities/School";
import { Admin } from "../entities/Admin";
import { QueryOrder } from "@mikro-orm/core";
import { isAuth } from "../middleware/isAuth";
// import { Student } from "../entities/Student";
// import session from "express-session";


@Resolver(School)
export class SchoolResolver {

  @FieldResolver(() => SchoolResponse)
  async school(@Root() school: School, @Ctx() { em, req }: MyContext)
  : Promise<SchoolResponse> {
    try{
    const admin = await em.fork({}).findOneOrFail(Admin, { id: req.session.userid }, { populate: ["school"] })
    const school = await em.fork({}).findOneOrFail(School, { id: admin.school.id }, 
      {populate: ["schoolName", "address", "country", "state", "members", "creator", "logoImgUrl", "bannerImgUrl",]});

      if (school){
        return {
          school,
        }
      } else{
        return {
          errors: [
            {
              field: "Error occured while fetching university.",
              message: `University with id could not be fetched`,
            },
          ],
        };

      }
    } catch (err){
      return {
          errors: [
            {
              field: "Error occured while fetching university.",
              message: `University with id ${school.id} could not be fetched`,
            },
          ],
      };

    }

    
  }

  @Query(() => [School])
  async getSchools(@Ctx() {em}: MyContext) : 
  Promise<School[]>{
    const schools= await em.fork({}).find(School, {}, {orderBy: {schoolName: QueryOrder.DESC} });
    return schools; 
  }

  @Query(() => SchoolResponse)
  async getGroupByName(
    @Arg("schoolName") schoolName: string,
    // @Arg("universityName") universityName: string,
    @Ctx() { em, req }: MyContext
  ): Promise<SchoolResponse> {
    try {
      const school = await em.fork({}).findOneOrFail(School, { schoolName: schoolName });
      if (school){
        return{
          school
        };
      }else{
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
    const student = await em.fork({}).findOne(School, { id: schoolId }, { populate: ["members"] });
    if (student){
      return student.members.count()
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
    //we can make it optional to create with logo and banner images
    @Ctx() { em, req }: MyContext
  ): Promise<SchoolResponse> {
    const admin = await em.fork({}).findOne(Admin, { id: req.session.userid }, {populate: ["school"]});

    if (admin ){
      const school = new School(schoolName, rcnumber, address, state, country);
      // user.university.schools.add(group);
      // group.moderators.add(user);
      // group.members.add(user);
      // user.subscriptions.add(group); 
      // user.moderating.add(group);
      await em.fork({}).persistAndFlush(school);
      await em.fork({}).persistAndFlush(admin);
      return { school, };
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
    const school = await em.fork({}).findOne(School, {id: schoolId});

    if (admin && school){
      //check if creator
      if (school.creator.id === req.session.userid){
        //alter details
        school.schoolName = schoolName ? schoolName : school.schoolName;
        school.rcnumber = rcnumber ? rcnumber : school.rcnumber;
        school.address = address ? address : school.address;
        school.state = state ? state : school.state;
        school.country = country ? country : school.country;
        school.logoImgUrl = logoImgUrl ? logoImgUrl : school.logoImgUrl;
        school.bannerImgUrl = bannerImgUrl ? bannerImgUrl : school.bannerImgUrl;

        return true;
      } else{
        return false;
      }
    }
    else{
      return false;
    }
      
  }



}