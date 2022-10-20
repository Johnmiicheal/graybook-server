create database gray2book;
create user postgres password 'password';
grant all privileges on database gray2book to postgres;
\c gray2book