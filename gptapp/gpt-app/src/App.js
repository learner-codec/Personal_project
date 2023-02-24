import React, { useState, useEffect } from "react";
import PDFJS from "pdfjs-dist/build/pdf";

const App = () => {
  const [summary, setSummary] = useState("");
  const [text, setText] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    console.log(file);
    PDFJS.getDocument(file).promise.then((pdf) => {
      let totalPages = pdf.numPages;
      let extractedText = "";

      for (let i = 1; i <= totalPages; i++) {
        pdf.getPage(i).then((page) => {
          page.getTextContent().then((content) => {
            extractedText += content.items.map((item) => item.str).join("");
            setText(extractedText);
          });
        });
      }
    });
  };

  useEffect(() => {
    const summarize = async () => {
      const response = await fetch(
        "https://api.openai.com/v1/engines/text-davinci-002/jobs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "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",
          },
          body: JSON.stringify({
            prompt: "Please summarize the following text:",
            max_tokens: 500,
            temperature: 0.5,
            text: text,
          }),
        }
      );

      const result = await response.json();
      setSummary(result.choices[0].text);
    };

    if (text) {
      summarize();
    }
  }, [text]);

  return (
    <div>
      <input type="file" onChange={handleFileUpload} />
      <br />
      <br />
      <h3>Summary:</h3>
      <p>{summary}</p>
    </div>
  );
};

export default App;
