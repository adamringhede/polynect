FROM node:latest

ADD . /opt/webapp/
WORKDIR /opt/webapp
RUN npm install
     
CMD node .
