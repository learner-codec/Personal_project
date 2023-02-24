import { useEffect, useState } from "react";
import { Configuration, OpenAIApi } from "openai";

import React from "react";
import styled from "styled-components";

const Container = styled.div``;
const Summary = styled.div`
  background-color: #8989f7;
`;

const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

async function getPageText(pdf, type, pageNum = 1) {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();

  const items = textContent.items.filter((item) => item.str.trim());
  console.log({ pageNum, page, textContent, items });

  if (type === "all") return items.map(({ str }) => str).join("");
  return extractData(items);
}

function extractData(items) {
  const newItems = items
    .filter((item) => item.str.trim())
    .map((item) => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      w: item.width,
      h: item.height,
    }));
  console.log("items are ==> ", newItems);
}

function generatePrompt(data, exProm) {
  if (exProm !== "") {
    return `s Summarize this research paper. I am sending one page by one page. summarize it within 100 words . 
  TOPIC: research paper.
  PAPER:${data}`;
  } else {
    return ` point out the main take-aways in this text and give proper details. provide atleast 5 key points. 
  TEXT:${data}
  `;
  }
}
const PDF = () => {
  const [summary, setSummary] = useState("");
  const [pdf, setPdf] = useState();
  const [totalresult, setResult] = useState("");
  const [type, setType] = useState("all");

  function readFile(event) {
    let file = event.currentTarget.files[0];

    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async () => {
      const data = reader.result;
      loadPDF(data);
    };
  }

  async function loadPDF(data) {
    const now = Date.now();

    // const { getDocument } = await import('pdfjs-dist');
    // await import('pdfjs-dist/build/pdf.worker.entry');
    const [{ getDocument }] = await Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.entry"),
    ]);

    console.log("mm-time", Date.now() - now);

    // const pdf = await pdfjsLib.getDocument(data).promise;
    const pdf = await getDocument(data).promise;
    console.log({ pdf });
    setPdf(pdf);
  }

  async function pdfToText() {
    let result = "";
    let allPages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      result = await getPageText(pdf, type, i);
      // console.log(result);
      allPages.push(result);
    }
    setResult(allPages);
  }

  const onTypeChange = (e) => {
    setType(e.currentTarget.value);
  };

  useEffect(() => {
    if (pdf) pdfToText();
  }, [pdf, type]);

  useEffect(() => {
    const summarize = async () => {
      if (!configuration.apiKey) {
        console.log(
          "OpenAI API key not configured, please follow instructions in README.md"
        );
      }
      console.log("hhhhhhhhhhhh", totalresult.length);
      let collect_result = "";
      for (let i = 0; i <= totalresult.length; i++) {
        try {
          const response = await openai.createCompletion({
            model: "text-davinci-002",
            prompt: generatePrompt(
              totalresult[i],
              ` page ${i} of ${totalresult.length} pages`
            ),
            max_tokens: 256,
            temperature: 0.2,
            presence_penalty: 0.5,
            top_p: 1,
            n: 2,
          });

          collect_result += (await response.data.choices[0].text) + "\n\n\n";
        } catch (error) {
          console.log(error);
        }
      }
      setSummary(collect_result);
      // console.log("totalresult ", collect_result);
      // const response = await openai.createCompletion({
      //   model: "text-davinci-002",
      //   prompt: generatePrompt(collect_result, ""),
      //   max_tokens: 1000,
      //   temperature: 0.2,
      //   top_p: 1,
      // });
      // // response.then((data) => {
      // //   // Do something with the data here
      // //   console.log(data);
      // //   console.log("response is ==>", data);
      // //   // // const result = await response.json();
      // //   // const result = data.choices[0].text;
      // //   // console.log(result);
      // //   // setSummary(result);
      // // });
      // console.log("response is ==>", response);
      // const result = await response.data.choices[0].text;
      // console.log("results are ==> ", result);
      // setSummary(result);
    };

    if (totalresult) {
      summarize();
    }
  }, [totalresult]);

  return (
    <Container>
      <div>
        <input type="file" accept=".pdf" onChange={readFile} />
      </div>

      <div>
        <label htmlFor="all">All Text</label>
        <input
          type="radio"
          name="type"
          id="all"
          value="all"
          checked={type === "all"}
          onChange={onTypeChange}
        />
        <label htmlFor="data">Extracted Data</label>
        <input
          type="radio"
          name="type"
          id="data"
          value="data"
          checked={type === "data"}
          onChange={onTypeChange}
        />
      </div>

      <h2>Result: {pdf && `(pages:${pdf.numPages})`}</h2>
      <Summary style={{ whiteSpace: "pre-wrap" }}>{summary}</Summary>
    </Container>
  );
};

export default PDF;
