import express from 'express';
import path from 'path';
import dotenv from "dotenv";
import { Client } from "@notionhq/client";
// 한국 시간으로 설정하기
process.env.TZ = "Asia/Seoul";

dotenv.config();
const app = express();
const __dirname = path.resolve();
let port = 8080;

const notion = new Client({
  auth: process.env.AUTH,
});

const databaseId = process.env.DBID;

app.get('/', async (req, res) => {
  const response = await getItem(); // getItem 함수 실행
  res.sendFile(path.join(__dirname,"/index.html"));
});

app.get('/data', async (req, res) => {
  const response = await getItem(); // getItem 함수 실행
  res.json(response);
});

app.get('/submit', async (req, res) => {
  const inputValue = req.query.inputValue;
  try {
    await addNameToOrderer(inputValue);
    // 데이터 수정 후 클라이언트를 새로고침하는 코드
    res.redirect('/');
  } catch (error) {
    console.error("이름 추가 오류:", error);
    // 오류 발생 시 적절한 응답을 보내거나 오류 처리 로직을 추가할 수 있습니다.
    res.status(500).send('오류가 발생했습니다.');
  }
});

const server = app.listen(port, () => {
  console.log(`server on ${port}`);
});

async function getItem() {
  const response = await notion.databases.query({
    database_id: databaseId,
  });
  return response; // 응답을 반환
}


// 현재 한국 시간 가져오기
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');

const formattedDate = `${year}-${month}-${day}`;
// Orderer 속성에 이름 추가하는 함수
async function addNameToOrderer(inputName) {
  try {
    // 오늘 날짜 데이터 가져오기
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Date",
        date: {
          equals: formattedDate,
        },
      },
    });

    if (response.results.length === 0) {
      console.log("오늘 날짜에 해당하는 데이터가 없습니다.");
      return;
    }

    // 오늘 날짜 데이터의 첫 번째 항목 가져오기
    const pageId = response.results[0].id;
    
    // 이름 추가
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Orderer: {
          multi_select: [
            ...response.results[0].properties.Orderer.multi_select,
            {
              name: inputName, // 추가할 이름
            },
          ],
        },
      },
    });

    console.log("["+ today +"]"+"이름 추가 완료");
  } catch (error) {
    console.error("이름 추가 오류:", error);
  }
}