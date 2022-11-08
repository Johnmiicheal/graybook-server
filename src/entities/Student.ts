import {
  Entity,
  PrimaryKey,
  Property,
  ManyToMany,
  Collection,
  ManyToOne,
} from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";

import { School } from "./School";
import { Admin } from "./Admin";
import { GrayCase } from "./GrayCase";

@ObjectType()
@Entity()
export class Student {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property()
  createdAt = new Date();

  @Field()
  @Property()
  firstName!: string;

  @Field()
  @Property()
  lastName!: string;

  @Field()
  @Property()
  gradeClass!: string;

  @Field()
  @Property()
  gender!: string;

  @Field()
  @Property()
  ageInput!: number;

  @Field()
  @Property({ nullable: true })
  birthDate: Date = new Date();

  @Property({ nullable: true })
  parentName: string;

  @Property({ nullable: true, length: 12 })
  parentNumber: string;

  @Property({ nullable: true })
  parentEmail: string;

  @Property({ nullable: true })
  homeAddress: string;

  @Property({ nullable: true })
  state: string;

  @Property({ nullable: true })
  lgaOrigin: string;

  @Property({ nullable: true })
  academicResult: string;

  @Field(() => Boolean)
  @Property()
  isArchived = false;

  @Field(() => String)
  @Property()
  profileImgUrl = "https://i.imgur.com/OQENGf1.jpeg";

  @ManyToMany(() => School, (school) => school.members, { owner: true })
  enrolled = new Collection<School>(this);

  @ManyToMany(() => GrayCase, (grayCase) => grayCase.defaulter, { owner: true })
  defaults = new Collection<GrayCase>(this);

  @ManyToOne(() => School)
  school: School;

  @ManyToOne(() => Admin)
  admin: Admin;

  constructor(
    firstName: string,
    lastName: string,
    gradeClass: string,
    gender: string,
    ageInput: number,
    birthDate: Date,
    parentName: string,
    parentNumber: string,
    parentEmail: string,
    homeAddress: string,
    state: string,
    lgaOrigin: string,
    academicResult: string,
    profileImgUrl: string,
    admin: Admin,
    school: School,
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.gradeClass = gradeClass;
    this.gender = gender;
    this.ageInput = ageInput;
    this.birthDate = birthDate;
    this.parentName = parentName;
    this.parentNumber = parentNumber;
    this.parentEmail = parentEmail;
    this.homeAddress = homeAddress;
    this.state = state;
    this.lgaOrigin = lgaOrigin;
    this.academicResult = academicResult;
    this.profileImgUrl = profileImgUrl;
    this.admin = admin;
    this.school = school
  }
}
