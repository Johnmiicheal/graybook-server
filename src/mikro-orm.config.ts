import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

require("dotenv").config();

import { School } from "./entities/School";
import { Student } from "./entities/Student";
import { GrayCase } from "./entities/GrayCase";
import { Admin } from "./entities/Admin";

import path from 'path';

export default {
    migrations:{
        path: path.join(__dirname +'/migrations'), 
        pattern: /^[\w-]+\d+\.[tj]s$/, 
    },
    entities:[
        School,
        Student,
        GrayCase,
        Admin
    ],
    dbName:process.env.PG_DATABASE,
    type:'postgresql',
    debug: !__prod__,
    password: process.env.PG_PASSWORD,
    Admin: process.env.PG_ACCOUNT,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    metadataProvider: TsMorphMetadataProvider,
} as Parameters<typeof MikroORM.init>[0];


