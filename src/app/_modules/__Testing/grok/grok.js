const API_KEY = '97ceffee-abda-4d94-a461-3a8d87526da4';


function testMedian() {
    console.log("Test median function placeholder executed.");
}

async function callGrok(prompt) {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'grok-4.5',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1500
        })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
}

// Add these functions to fix the ReferenceError:
async function runGrokDemo() {
    const statusEl = document.getElementById('status');
    const outputEl = document.getElementById('output');
    
    statusEl.textContent = 'Calling Grok...';
    outputEl.innerHTML = '';

    try {
        const prompt = "Can you write a correct JavaScript function to find the median of an array of numbers?";
        const result = await callGrok(prompt);
        
        statusEl.textContent = 'Success!';
        outputEl.innerHTML = `<pre>${result}</pre>`;
    } catch (error) {
        statusEl.textContent = 'Error: ' + error.message;
    }
}
