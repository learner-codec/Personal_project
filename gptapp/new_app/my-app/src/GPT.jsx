import React, { useRef } from "react";
import { useEffect, useState } from "react";
import { Configuration, OpenAIApi } from "openai";
import styled from "styled-components";
import SendIcon from "@mui/icons-material/Send";
const configuration = new Configuration({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const Container = styled.div`
  background-color: #c6a8f7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 20px;
`;
const Header = styled.div``;
const InputContainer = styled.div`
  background-color: #c6a8f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 20vh;
  width: 100vw;
  position: absolute;
  bottom: 0;
`;

const Input = styled.input`
  flex: 1;
  bottom: 0;
  width: 50%;
  height: 30px;
  padding: 5px;
  border-radius: 5px;
  font-size: 16px;
  margin-bottom: 10px;
  background-color: #c3fb7f;
`;
const Button = styled.button`
  background-color: #c3fb7f;
  flex: 0.1;
  width: 10%;
  display: flex;
  align-items: center;
  height: 5vh;
  margin-bottom: 10px;
  border-radius: 2px;
`;

const InputHistory = styled.div`
  align-items: flex-start;
  height: 76vh;
  width: 100vw;
  background-color: #c6a8f7;
  overflow-y: auto;
`;
const InputItem = styled.div`
  width: 80vw;
  padding: 5px;
  border-radius: 5px;
  margin-bottom: 10px;
  text-align: center;
  word-wrap: break-word;
`;
const PlaceHolder = styled.div`
  background-color: #d979f3;
  width: 20vw;
`;

const generatePrompt = (prompt) => {
  let prompt_ = prompt;
  return `talk to me. follow the instruction in the message.
  message: ${prompt_.toString()}`;
};

const GPT = () => {
  const inputHistoryRef = useRef(null);
  const [inputs, setInputs] = useState({});
  const [value, setValue] = useState("");
  const [AIresponse, setAIresponse] = useState("0");
  const [ready, setReady] = useState(false);
  const chunkSize = 1500;
  useEffect(() => {
    inputHistoryRef.current.scrollTop = inputHistoryRef.current.scrollHeight;
  }, [inputs]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (value !== "") {
      getResponse();
      setReady(true);
    }
  };

  const sendChunk = async (prompt) => {
    const response = await openai.createCompletion({
      model: "text-davinci-002",
      prompt: prompt,
      max_tokens: chunkSize,
    });
    return response;
  };

  const getResponse = async () => {
    console.log(
      "waiting for response nad the command is ",
      generatePrompt(value)
    );

    let prompt = generatePrompt(value);
    let response = "";
    while (prompt.length > chunkSize) {
      let chunk = prompt.slice(0, chunkSize);
      prompt = prompt.slice(chunkSize);
      let chunkResponse = await sendChunk(chunk);
      response += chunkResponse.data.choices[0].text;
    }
    if (prompt.length < chunkSize) {
      let finalChunkResponse = await sendChunk(prompt);
      response += finalChunkResponse.data.choices[0].text;
    }
    const result = response;
    console.log("result==>", result);
    setAIresponse(result);
    console.log("Ai=> ", AIresponse);
    const updated_inputs = {
      ...inputs,
      [`user: ${Date.now()}`]: value,
      [`gpt: ${Date.now()}`]: result,
    };
    setInputs(updated_inputs);
    console.log("inputs ", updated_inputs);
    setValue("");
    setReady(false);
  };

  //   useEffect(() => {

  //     if (value) {
  //       if (ready === true) {
  //         setReady(false);
  //         getResponse();
  //       }
  //     }
  //   }, [value]);

  return (
    <Container>
      <InputHistory ref={inputHistoryRef}>
        {/* {inputs.map((input, index) => (
          <React.Fragment key={index}>
            <InputItem
              dangerouslySetInnerHTML={{
                __html: input.toString().replace(/\n/g, "<br />"),
              }
            }
            />
          </React.Fragment>
        ))} */}
        {Object.entries(inputs).map(([key, val], index) => (
          <React.Fragment key={index}>
            <div style={{ display: "flex" }}>
              <div
                style={{
                  textAlign: "left",
                  padding: "10px 10px 10px 10px",
                  whiteSpace: "pre-wrap",
                  backgroundColor: index % 2 === 0 ? "#b086f4" : "#be8ff3",
                  fontSize: 15,
                }}
              >
                {key}
              </div>
              <div
                style={{
                  padding: "10px 10px 10px 100px",
                  textAlign: "left",
                  backgroundColor: index % 2 === 0 ? "#b086f4" : "#be8ff3",
                  width: "100%",
                  whiteSpace: "pre-wrap",
                  fontSize: 15,
                }}
              >
                {val}
              </div>
            </div>
          </React.Fragment>
        ))}
      </InputHistory>
      <form onSubmit={handleSubmit}></form>
      <InputContainer>
        <PlaceHolder></PlaceHolder>
        <Input
          type="text"
          placeholder="Type here"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Button onClick={handleSubmit} disabled={ready}>
          <SendIcon />
        </Button>
        <PlaceHolder></PlaceHolder>
      </InputContainer>
    </Container>
  );
};

export default GPT;
