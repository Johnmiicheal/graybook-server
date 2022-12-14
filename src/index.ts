import express from "express";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";
import connectRedis from "connect-redis";
import Redis from "ioredis";

import {MikroORM} from "@mikro-orm/core";
import microConfig from "./mikro-orm.config";

import {__prod__} from "./constants";

import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { AdminResolver } from "./resolvers/admin";
import { GrayCaseResolver } from "./resolvers/grayCase";
import { StudentResolver } from "./resolvers/student";
import { SchoolResolver } from "./resolvers/school";

require("dotenv").config();

console.log(process.env.NODE_ENV);



declare module 'express-session' {
    export interface SessionData {
      loadedCount: number;
      userid: number ;
    }
  }``


const main = async() => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const app = express();
    app.set("trust proxy", 1);
    app.use( cors({
      credentials: true,
      origin: [ String(process.env.CORS_ORIGIN), 'https://studio.apollographql.com' ]
    }));

    const redis = new Redis({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
    });

    const RedisStore = connectRedis(session);
    const redisStore = new RedisStore({
        client: redis,
    });
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit:50000}));
    app.use(express.json());


    app.use(
        session({
            store: redisStore,
            name: process.env.COOKIE_NAME,
            sameSite: "Strict",
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                path:"/",
                httpOnly: true,
                secure: false,
                maxAge: 1000 * 60 * 60 * 1024,
                domain: __prod__ ? ".graybook.app" : undefined,
            },
        } as any)
    );

    const apolloServer = new ApolloServer({
      csrfPrevention: true,
      schema: await buildSchema({
          resolvers: [ AdminResolver, GrayCaseResolver, StudentResolver, SchoolResolver ],
          validate: false,
        }),
        context: ({ req, res }) => ({
          req,
          res,
          redis,
          em : orm.em,
        }),
      });

      await apolloServer.start();
    
      apolloServer.applyMiddleware({
        app,
        cors: false,
      });
    
      app.listen({port: process.env.SERVER_PORT}, () => {
        console.log(`Server ready on port ${process.env.SERVER_PORT}`);
      });
}

main().catch((err) => console.error(err));
