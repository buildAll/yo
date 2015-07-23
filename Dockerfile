FROM node:0.12.7

MAINTAINER Hbomb <hbomb@126.com>

RUN mv /etc/apt/sources.list /etc/apt/sources.list.bak
ADD ./sources.list /etc/apt/sources.list

RUN apt-get update \
    && apt-get install -y ruby ruby-dev redis-server \
    && gem sources --remove https://ruby.taobao.org/ \
    && gem sources --remove https://rubygems.org/ \
    && gem sources -a https://ruby.taobao.org/ \
    && gem install compass -V

RUN mkdir /Code
WORKDIR /Code



RUN npm install -g  -d cnpm --registry=https://registry.npm.taobao.org 
RUN cnpm install -g -d gulp 
RUN cnpm install -g -d spm@3.4.3 
RUN spm config set registry http://spm.yoho.cn

ADD ./yo /Code/yo
ADD ./yo.yohobuy-mobile /Code/yo.yohobuy-mobile
ADD ./yo.demo /Code/yo.demo
ADD ./Makefile /Code/Makefile

RUN make

EXPOSE 3000