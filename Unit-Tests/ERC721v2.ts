// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { ERC721A, ERC721A__factory } from "../typechain-types";
// import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// describe("ERC721A", function() {
//   // Test fixture setup
//   async function deployERC721AFixture() {
//     const [owner, addr1, addr2] = await ethers.getSigners();
//     const ERC721AFactory = await ethers.getContractFactory("ERC721A");
//     const nft = await ERC721AFactory.deploy() as ERC721A;
//     await nft.ERC721A_Initialize("TestNFT", "TNFT");
    
//     return { nft, owner, addr1, addr2 };
//   }

//   describe("Initialization", function() {
//     it("Should initialize with correct name and symbol", async function() {
//       const { nft } = await loadFixture(deployERC721AFixture);
      
//       expect(await nft.name()).to.equal("TestNFT");
//       expect(await nft.symbol()).to.equal("TNFT");
//     });

//     it("Should start with total supply of 0", async function() {
//       const { nft } = await loadFixture(deployERC721AFixture);
      
//       expect(await nft.totalSupply()).to.equal(0);
//     });
//   });

//   describe("Minting", function() {
//     it("Should mint tokens correctly", async function() {
//       const { nft, owner, addr1 } = await loadFixture(deployERC721AFixture);
//       const quantity = 5;
      
//       await nft._safeMint(addr1.address, quantity);
      
//       expect(await nft.balanceOf(addr1.address)).to.equal(quantity);
//       expect(await nft.ownerOf(0)).to.equal(addr1.address);
//       expect(await nft.ownerOf(4)).to.equal(addr1.address);
//     });

//     it("Should revert when minting to zero address", async function() {
//       const { nft } = await loadFixture(deployERC721AFixture);
      
//       await expect(nft._safeMint(ethers.ZeroAddress, 1))
//         .to.be.revertedWithCustomError(nft, "MintToZeroAddress");
//     });

//     it("Should revert when minting zero quantity", async function() {
//       const { nft, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await expect(nft._safeMint(addr1.address, 0))
//         .to.be.revertedWithCustomError(nft, "MintZeroQuantity");
//     });
//   });

//   describe("Transfers", function() {
//     it("Should transfer tokens correctly", async function() {
//       const { nft, owner, addr1, addr2 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 1);
//       await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      
//       expect(await nft.ownerOf(0)).to.equal(addr2.address);
//       expect(await nft.balanceOf(addr1.address)).to.equal(0);
//       expect(await nft.balanceOf(addr2.address)).to.equal(1);
//     });

//     it("Should handle bulk transfers", async function() {
//       const { nft, addr1, addr2 } = await loadFixture(deployERC721AFixture);
//       const quantity = 3;
      
//       await nft._safeMint(addr1.address, quantity);
//       await nft.connect(addr1).transferBulkFrom(
//         addr1.address, 
//         addr2.address, 
//         [0, 1, 2]
//       );
      
//       expect(await nft.balanceOf(addr2.address)).to.equal(quantity);
//       for(let i = 0; i < quantity; i++) {
//         expect(await nft.ownerOf(i)).to.equal(addr2.address);
//       }
//     });

//     it("Should revert unauthorized transfers", async function() {
//       const { nft, addr1, addr2 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 1);
//       await expect(
//         nft.connect(addr2).transferFrom(addr1.address, addr2.address, 0)
//       ).to.be.revertedWithCustomError(nft, "TransferCallerNotOwnerNorApproved");
//     });
//   });

//   describe("Approvals", function() {
//     it("Should handle token approvals correctly", async function() {
//       const { nft, addr1, addr2 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 1);
//       await nft.connect(addr1).approve(addr2.address, 0);
      
//       expect(await nft.getApproved(0)).to.equal(addr2.address);
//     });

//     it("Should handle operator approvals correctly", async function() {
//       const { nft, addr1, addr2 } = await loadFixture(deployERC721AFixture);
      
//       await nft.connect(addr1).setApprovalForAll(addr2.address, true);
      
//       expect(await nft.isApprovedForAll(addr1.address, addr2.address)).to.be.true;
//     });

//     it("Should revert approval to current owner", async function() {
//       const { nft, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 1);
//       await expect(
//         nft.connect(addr1).approve(addr1.address, 0)
//       ).to.be.revertedWithCustomError(nft, "ApprovalToCurrentOwner");
//     });
//   });

//   describe("Burning", function() {
//     it("Should burn tokens correctly", async function() {
//       const { nft, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 1);
//       await nft._burn(0);
      
//       expect(await nft.totalSupply()).to.equal(0);
//       await expect(nft.ownerOf(0))
//         .to.be.revertedWithCustomError(nft, "OwnerQueryForNonexistentToken");
//     });

//     it("Should update balances and counters after burning", async function() {
//       const { nft, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 2);
//       await nft._burn(0);
      
//       expect(await nft.balanceOf(addr1.address)).to.equal(1);
//       expect(await nft.totalSupply()).to.equal(1);
//     });
//   });

//   describe("Multi-token Ownership Verification", function() {
//     it("Should verify multiple token ownership correctly", async function() {
//       const { nft, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 3);
//       expect(await nft.multiOwnerOf([0, 1, 2], addr1.address)).to.be.true;
//     });

//     it("Should return false if any token has different owner", async function() {
//       const { nft, addr1, addr2 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 2);
//       await nft._safeMint(addr2.address, 1);
//       expect(await nft.multiOwnerOf([0, 1, 2], addr1.address)).to.be.false;
//     });

//     it("Should revert on empty token array", async function() {
//       const { nft, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await expect(nft.multiOwnerOf([], addr1.address))
//         .to.be.revertedWithCustomError(nft, "InvalidLength");
//     });
//   });
// });