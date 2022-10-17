import { Entity, PrimaryKey, Property, ManyToOne, ManyToMany, Collection } from "@mikro-orm/core";
import { Admin } from "./Admin";
import { School } from "./School";
import { ObjectType, Field } from "type-graphql";
import { Student } from "./Student";

@ObjectType()
@Entity()
export class GrayCase {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Property()
  updatedAt: Date = new Date();

  @Field(() => String)
  @Property()
  category!: string;

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
  @Property()
  isActive: boolean = false;

  @Field()
  @Property()
  voteCount: number = 0;

  @Field()
  @Property()
  wasEdited: boolean = false;

  @ManyToOne(() => Admin)
  owner: Admin;

  @ManyToMany(() => School, school => school.grayed)
  school = new Collection<School>(this);

  @ManyToMany(() => Admin, admin => admin.archivedGrayCase)
  archived = new Collection<Admin>(this);

  @ManyToMany(() => Student, student => student.default)
  defaulter = new Collection<Student>(this);

  constructor(
    owner: Admin,
    category: string,
    firstName: string,
    lastName: string,
    gradeClass: string,
    gender: string,
    ageInput: number
  ) {
    this.owner = owner;
    this.firstName = firstName;
    this.lastName = lastName;
    this.gradeClass = gradeClass;
    this.gender = gender;
    this.ageInput = ageInput;
    this.category = category;
  }
}
