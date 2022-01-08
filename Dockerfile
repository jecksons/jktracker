FROM  node

WORKDIR  /app

ENV PATH /app/node_modules/.bin:$PATH

COPY  package.json   ./

RUN npm install --silent
RUN npm install react-scripts@5.0.0 -g --silent

COPY  .  ./

ENV   TZ America/Sao_Paulo

EXPOSE   $REACT_APP_API_URL

CMD   ["npm", "start"]