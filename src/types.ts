
import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';
import { Request, Response } from 'express';
import { Redis } from "ioredis";
import { ObjectType, Field } from 'type-graphql';
import { Admin } from './entities/Admin';
import { School } from './entities/School';
import { Student } from './entities/Student';
import { GrayCase } from './entities/GrayCase';

export type MyContext = {
  req:  Request ;
  res: Response;
  redis: Redis;
  em: EntityManager<IDatabaseDriver<Connection>>;
}

@ObjectType()
export class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
export class AdminResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => Admin, { nullable: true })
  admin?: Admin;
}

@ObjectType()
export class StudentResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => Student, { nullable: true })
  student?: Student;
}

@ObjectType()
export class SchoolResponse{
    @Field(()=> [FieldError], {nullable: true})
    errors?: FieldError[];
    @Field(()=>School, {nullable: true})
    school?: School;
}
@ObjectType()
export class GrayCaseResponse{
    @Field(()=> [FieldError], {nullable: true})
    errors?: FieldError[];
    @Field(()=>GrayCase, {nullable: true})
    grayCase?: GrayCase;
}


@ObjectType()
export class PaginatedGrayCase {
  @Field(() => [GrayCase], {nullable: true})
  grayCase?: GrayCase[];
  @Field()
  hasMore: boolean;
  @Field()
  cursor: number;
}

//  req: Request & { session: Express.Session };
