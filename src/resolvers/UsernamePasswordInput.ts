import { InputType, Field } from "type-graphql";
@InputType()
export class UsernamePasswordInput {
  @Field()
  adminName: string;
  @Field()
  phoneNumber: string;
  @Field()
  email: string;
  @Field()
  password: string;
}
