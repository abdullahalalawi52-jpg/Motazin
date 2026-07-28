// Test script using Node.js to avoid PowerShell encoding issues
const urlChat = 'http://localhost:3000/api/chat';
const urlParse = 'http://localhost:3000/api/parse';

async function runTests() {
  console.log('Testing /api/chat...');
  
  const chatBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: "كيف أعد ميزانية بسيطة؟" }]
      }
    ],
    system_instruction: {
      parts: [{ text: "أنت مستشار مالي ومحاسب قانوني ذكي" }]
    }
  };

  try {
    const chatRes = await fetch(urlChat, {
      method: 'POST',
      headers: {
        'origin': 'http://localhost',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chatBody)
    });
    
    console.log(`Status: ${chatRes.status}`);
    const chatData = await chatRes.json();
    console.log('Response:', JSON.stringify(chatData, null, 2));
  } catch (err) {
    console.error('Error hitting /api/chat:', err);
  }

  console.log('\n--------------------------------\n');
  console.log('Testing /api/parse...');
  
  const parseBody = {
    text: "فاتورة مطعم بقيمة 150 ريال بتاريخ 10/10/2026"
  };

  try {
    const parseRes = await fetch(urlParse, {
      method: 'POST',
      headers: {
        'origin': 'http://localhost',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parseBody)
    });

    console.log(`Status: ${parseRes.status}`);
    const parseData = await parseRes.json();
    console.log('Response:', JSON.stringify(parseData, null, 2));
  } catch (err) {
    console.error('Error hitting /api/parse:', err);
  }
}

runTests();
