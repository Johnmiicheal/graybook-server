import {
  Entity,
  PrimaryKey,
  Property,
  Collection,
  OneToMany,
  ManyToMany,
  OneToOne,
} from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";

import { GrayCase } from "./GrayCase";
import { School } from "./School";
import { Student } from "./Student";

@ObjectType()
@Entity()
export class Admin {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property()
  createdAt = new Date();

  @Field()
  @Property({ unique: true, length: 60 })
  adminName!: string;

  @Field()
  @Property({ unique: true })
  phoneNumber!: string;

  @Field()
  @Property({ unique: true, length: 120 })
  email!: string;

  @Property()
  passwordHash!: string;

  @Field(() => Boolean)
  @Property()
  isDisabled = false;

  @Field(() => String)
  @Property()
  profileImgUrl = "https://i.imgur.com/OQENGf1.jpeg";

  @OneToMany(() => GrayCase, (grayCase) => grayCase.owner)
  grayCase = new Collection<GrayCase>(this);

  @OneToMany(() => Student, (student) => student.admin)
  student = new Collection<Student>(this);

  @OneToOne()
  school: School | null;

  @ManyToMany(() => GrayCase, (post) => post.archived, { owner: true })
  archivedGrayCase = new Collection<GrayCase>(this);

  constructor(
    adminName: string,
    phoneNumber: string,
    email: string,
    passwordHash: string,
  ) {
    this.adminName = adminName;
    this.phoneNumber = phoneNumber;
    this.email = email;
    this.passwordHash = passwordHash;
  }
}
