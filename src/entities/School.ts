import {
  Collection,
  Entity,
  PrimaryKey,
  Property,
  ManyToMany,
  OneToOne,
} from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";
import { Student } from "./Student";
import { GrayCase } from "./GrayCase";
import { Admin } from "./Admin";

@ObjectType()
@Entity()
export class School {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Property({ length: 60 })
  schoolName!: string;

  @Field()
  @Property({ unique: true, length: 8 })
  rcnumber!: number;

  @Field()
  @Property()
  address!: string;

  @Field()
  @Property()
  state!: string;

  @Field()
  @Property()
  country!: string;

  @Field()
  @Property({ length: 3000 })
  description: string = "Description goes here";

  @Field()
  @Property({ length: 10485756 })
  logoImgUrl: string = "https://i.imgur.com/OQENGf1.jpeg";

  @Field()
  @Property()
  bannerImgUrl: string = "https://i.imgur.com/OQENGf1.jpeg";

  @ManyToMany(() => GrayCase, (grayCase) => grayCase.school, { owner: true })
  grayed = new Collection<GrayCase>(this);

  @ManyToMany(() => Student, (student) => student.enrolled)
  members = new Collection<Student>(this);

  @OneToOne()
  creator!: Admin;

  constructor(
    schoolName: string,
    rcnumber: number,
    address: string,
    state: string,
    country: string,
    logoImgUrl: string,
    creator: Admin,
  ) {
    this.schoolName = schoolName;
    this.rcnumber = rcnumber;
    this.address = address;
    this.state = state;
    this.country = country;
    this.logoImgUrl = logoImgUrl;
    this.creator = creator;
  }
}
