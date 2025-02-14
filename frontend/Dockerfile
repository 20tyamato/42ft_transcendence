FROM node:22.13.0

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# ボリュームマウントのためのディレクトリ作成
RUN mkdir -p /app/node_modules
RUN npm install gsap

# 開発サーバー起動
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
