import pkg from "hardhat";
import fs from "fs";
import path from "path";
const { ethers } = pkg;

async function main() {
  console.log("🚀 Deploying GetMeChai contract...");
  console.log("");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  console.log("");

  // Deploy contract
  const GetMeChai = await ethers.getContractFactory("GetMeChai");
  const getMeChai = await GetMeChai.deploy();
  await getMeChai.waitForDeployment();

  const address = await getMeChai.getAddress();
  console.log("✅ Contract deployed at:", address);
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    contractAddress: address,
    deployerAddress: deployer.address,
    network: pkg.network.name,
    timestamp: new Date().toISOString(),
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
  };

  // Save to frontend directory
  const frontendDir = path.join(process.cwd(), "../getmechai-frontend");
  const deploymentPath = path.join(frontendDir, "deployment.json");
  
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("📄 Deployment info saved to:", deploymentPath);

  // Copy ABI to frontend
  const artifactPath = path.join(
    process.cwd(),
    "artifacts/contracts/GetMeChai.sol/GetMeChai.json"
  );
  const abiDestPath = path.join(frontendDir, "abi/GetMeChai.json");
  
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(abiDestPath, JSON.stringify(artifact, null, 2));
    console.log("📄 ABI copied to:", abiDestPath);
  }

  console.log("");
  console.log("🎯 Next Steps:");
  console.log("1. Update .env.local with:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS="${address}"`);
  console.log("");
  console.log("2. Configure MetaMask:");
  console.log("   - Network: Hardhat Local");
  console.log("   - RPC URL: http://127.0.0.1:8545");
  console.log("   - Chain ID: 31337");
  console.log("");
  console.log("3. Import test account to MetaMask using private key from Hardhat node");
  console.log("");
  console.log("4. Start frontend: cd ../getmechai-frontend && npm run dev");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
  });
