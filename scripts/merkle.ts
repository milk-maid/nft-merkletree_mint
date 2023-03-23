// Import necessary libraries and dependencies
import { ethers } from "hardhat";
import * as fs from "fs";
// import MerkleTree from "merkle-tree-solidity";
declare const require: any;
const MerkleTree = require('merkle-tree-solidity').default;

async function main() {
  // Read in the balances.csv file
  const fileName = "balances.csv";
  const fileContent = fs.readFileSync(fileName, "utf-8");
  // Split the rows into an array and remove the header row
  const rows = fileContent.trim().split("\n").slice(1);

  // Generate the leaves for the Merkle tree
  const leaves = rows.map((row) => {
    // Extract the address and amount from the row
    const [address, amount] = row.split(",");
    // Convert the address and amount to bytes and pad them to 32 bytes
    const addressBytes = ethers.utils.hexZeroPad(address, 32);
    const amountHex = ethers.utils.hexlify(parseInt(amount, 10));
    const amountBytes = ethers.utils.hexZeroPad(amountHex, 32);
    // Hash the address and amount bytes using the keccak256 hash function and convert to a buffer
    const leaf = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [addressBytes, amountBytes]);
    return Buffer.from(leaf.slice(2), "hex");
  });

  // Generate the Merkle tree
  const tree = new MerkleTree(leaves, ethers.utils.solidityKeccak256);
  const merkleRoot = tree.getRoot();

  const merkleRootHex = "0x" + Buffer.from(merkleRoot).toString("hex");

  console.log(`Merkle root: ${merkleRoot}`);
  console.log(`Merkle root (hex): ${merkleRootHex}`);

  // Generate proofs for each address/amount pair
  const proofs = rows.map((row) => {
    const [address, amount] = row.split(",");
    const addressBytes = ethers.utils.hexZeroPad(address, 32);
    const amountHex = ethers.utils.hexlify(parseInt(amount, 10));
    const amountBytes = ethers.utils.hexZeroPad(amountHex, 32);
    const leaf = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [addressBytes, amountBytes]);
    const proof = tree.getProof(Buffer.from(leaf.slice(2), "hex"));
    return {
      address,
      amount,
      proof: proof.map((p: Buffer) => p.toString("hex")), // convert Buffer objects to string representations
    };
  });

  // Store the Merkle tree data in a JSON file
  const merkleData = {
    merkleRoot: "0x" + merkleRoot.toString("hex"),
    proofs: proofs,
  };

  console.log(merkleData);

  const outputFile = "merkleData.json";
  fs.writeFileSync(outputFile, JSON.stringify(merkleData));
  console.log(`Merkle tree data written to ${outputFile}`);
}

// Call the main function
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


