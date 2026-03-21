import { analyzeMarketConditions } from "../lib/engine/strategy-advisor";

async function test() {
  console.log("--- Testing Market Insights Integration ---");
  const analysis = await analyzeMarketConditions();
  
  console.log("Market Signal:", analysis.signalLabel);
  console.log("Reasoning:");
  analysis.suggestion.reasoning.forEach((r, i) => {
    console.log(`${i + 1}. ${r}`);
  });
  
  const hasInsights = analysis.suggestion.reasoning.some(r => 
    r.includes("Gamma") || r.includes("低阻力上行通道")
  );
  
  if (hasInsights) {
    console.log("\n✅ SUCCESS: New market insights detected in analysis reasoning!");
  } else {
    console.log("\n❌ NOTE: Current price may not be in the specified zones ($59k-$72k or near $75k).");
    console.log("Current Price:", analysis.btc.price);
  }
}

test().catch(console.error);
