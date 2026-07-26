import { Groq } from "https://esm.sh/groq-sdk";

const apiKeyInput = document.getElementById("apiKey");
const promptInput = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");
const outputPre = document.getElementById("output");

sendBtn.addEventListener("click", async () => {
    const apiKey = apiKeyInput.value.trim();
    const promptText = promptInput.value.trim();

    if (!apiKey) {
        alert("Por favor, introduce tu API Key de Groq.");
        return;
    }

    outputPre.textContent = "Conectando y generando respuesta...";

    try {
        // Inicializar el cliente habilitando el uso en navegador
        const groq = new Groq({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true // Obligatorio para entornos cliente web
        });

        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "user",
                    "content": promptText
                }
            ],
            "model": "openai/gpt-oss-120b",
            "temperature": 1,
            "max_completion_tokens": 2048,
            "top_p": 1,
            "stream": true,
            "reasoning_effort": "medium",
            "stop": null
        });

        outputPre.textContent = ""; // Limpiar antes de recibir el stream

        for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || '';
            outputPre.textContent += content;
        }

    } catch (error) {
        console.error(error);
        outputPre.textContent = "Error: " + error.message;
    }
});