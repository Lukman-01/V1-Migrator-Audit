// import { ethers } from "hardhat";
// import { expect } from "chai";
// import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

// describe("ERC721A", function () {
//   async function deployERC721AFixture() {
//     const [owner, addr1, addr2] = await ethers.getSigners();
    
//     const ERC721AMock = await ethers.getContractFactory("ERC721Av1");
//     const nft = await ERC721AMock.deploy("ATL Acre", "aATL");
    
//     return { nft, owner, addr1, addr2 };
//   }

//   describe("Deployment", function () {
//     it("Should set the right name and symbol", async function () {
//       const { nft } = await loadFixture(deployERC721AFixture);
      
//       expect(await nft.name()).to.equal("ATL Acre");
//       expect(await nft.symbol()).to.equal("aATL");
//     });

//     it("Should start with token index 0", async function () {
//       const { nft } = await loadFixture(deployERC721AFixture);
      
//       // Access internal _currentIndex using a view function if available
//       // or check first mint starts at 0
//       expect(await nft.totalSupply()).to.equal(0);
//     });
//   });

//   describe("Minting", function () {
//     it("Should mint tokens correctly", async function () {
//       const { nft, owner, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1, 5);
      
//       expect(await nft.balanceOf(addr1)).to.equal(5);
//       expect(await nft.ownerOf(0)).to.equal(addr1);
//       expect(await nft.ownerOf(4)).to.equal(addr1);
//     });

//     it("Should revert when minting to zero address", async function () {
//       const { nft } = await loadFixture(deployERC721AFixture);
      
//       await expect(nft._safeMint(ethers.ZeroAddress, 1))
//         .to.be.revertedWithCustomError(nft, "MintToZeroAddress");
//     });

//     it("Should revert when minting zero quantity", async function () {
//       const { nft, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await expect(nft._safeMint(addr1, 0))
//         .to.be.revertedWithCustomError(nft, "MintZeroQuantity");
//     });

//     it("Should track total supply correctly", async function () {
//       const { nft, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1, 3);
//       expect(await nft.totalSupply()).to.equal(3);
      
//       await nft._safeMint(addr1, 2);
//       expect(await nft.totalSupply()).to.equal(5);
//     });
//   });

//   describe("Transfers", function () {
//     it("Should transfer tokens correctly", async function () {
//       const { nft, addr1, addr2 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 1);
//       await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      
//       expect(await nft.ownerOf(0)).to.equal(addr2.address);
//       expect(await nft.balanceOf(addr1.address)).to.equal(0);
//       expect(await nft.balanceOf(addr2.address)).to.equal(1);
//     });

//     it("Should fail when transferring tokens without approval", async function () {
//       const { nft, addr1, addr2 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 1);
      
//       await expect(nft.connect(addr2).transferFrom(addr1.address, addr2.address, 0))
//         .to.be.revertedWithCustomError(nft, "TransferCallerNotOwnerNorApproved");
//     });

//     it("Should allow approved address to transfer", async function () {
//       const { nft, addr1, addr2 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 1);
//       await nft.connect(addr1).approve(addr2.address, 0);
//       await nft.connect(addr2).transferFrom(addr1.address, addr2.address, 0);
      
//       expect(await nft.ownerOf(0)).to.equal(addr2.address);
//     });
//   });

//   describe("Approvals", function () {
//     it("Should approve and revoke correctly", async function () {
//       const { nft, addr1, addr2 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 1);
//       await nft.connect(addr1).approve(addr2.address, 0);
      
//       expect(await nft.getApproved(0)).to.equal(addr2.address);
      
//       // Transfer should clear approval
//       await nft.connect(addr2).transferFrom(addr1.address, addr2.address, 0);
//       expect(await nft.getApproved(0)).to.equal(ethers.ZeroAddress);
//     });

//     it("Should set approval for all correctly", async function () {
//       const { nft, addr1, addr2 } = await loadFixture(deployERC721AFixture);
      
//       await nft.connect(addr1).setApprovalForAll(addr2.address, true);
//       expect(await nft.isApprovedForAll(addr1.address, addr2.address)).to.be.true;
      
//       await nft.connect(addr1).setApprovalForAll(addr2.address, false);
//       expect(await nft.isApprovedForAll(addr1.address, addr2.address)).to.be.false;
//     });

//     it("Should revert when approving to self", async function () {
//       const { nft, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await expect(nft.connect(addr1).setApprovalForAll(addr1.address, true))
//         .to.be.revertedWithCustomError(nft, "ApproveToCaller");
//     });
//   });

//   describe("Burning", function () {
//     it("Should burn tokens correctly", async function () {
//       const { nft, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 2);
//       await nft._burn(0);
      
//       expect(await nft.totalSupply()).to.equal(1);
//       await expect(nft.ownerOf(0))
//         .to.be.revertedWithCustomError(nft, "OwnerQueryForNonexistentToken");
//     });

//     it("Should update ownership data after burning", async function () {
//       const { nft, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 2);
//       await nft._burn(0);
      
//       expect(await nft.balanceOf(addr1.address)).to.equal(1);
//       expect(await nft.ownerOf(1)).to.equal(addr1.address);
//     });
//   });

//   describe("Token URI", function () {
//     it("Should return empty string for base URI by default", async function () {
//       const { nft, addr1 } = await loadFixture(deployERC721AFixture);
      
//       await nft._safeMint(addr1.address, 1);
//       expect(await nft.tokenURI(0)).to.equal("");
//     });

//     it("Should revert URI query for nonexistent token", async function () {
//       const { nft } = await loadFixture(deployERC721AFixture);
      
//       await expect(nft.tokenURI(0))
//         .to.be.revertedWithCustomError(nft, "URIQueryForNonexistentToken");
//     });
//   });
// });