import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('pooler.supabase.com')
    ? new Sequelize('postgres', 'postgres.mmlrvjdukspztwabghnu', process.env.DB_PASSWORD || process.env.SUPABASE_PASS, {
        host: 'aws-0-us-west-2.pooler.supabase.com',
        port: 6543,
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true
        }
    })
    : (process.env.DATABASE_URL 
        ? new Sequelize(process.env.DATABASE_URL, {
            dialect: 'postgres',
            protocol: 'postgres',
            logging: false,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            },
            pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
            define: { timestamps: true, underscored: true }
        })
        : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            logging: false,
            pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
            define: { timestamps: true, underscored: true }
        })
    );

export default sequelize;