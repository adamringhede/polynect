FROM node:7.2

ADD . /opt/webapp/
WORKDIR /opt/webapp
RUN npm install
     
CMD node .
