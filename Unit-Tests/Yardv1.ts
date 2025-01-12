import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import hre, { ethers } from "hardhat";
  
  describe("ATLYARD", function () {
    async function deployATLYARDFixture() {
      const [owner, addr1, addr2, feeCollector] = await hre.ethers.getSigners();
  
      const MockERC20 = await hre.ethers.getContractFactory("PRLZ");
      const mockToken = await MockERC20.deploy();
  
      const ATLYARD = await hre.ethers.getContractFactory("ATLYARD");
      const nft = await ATLYARD.deploy(mockToken);
  
      const BATCH_QUANTITY = 100;
      const BATCH_PRICE = ethers.parseEther("0.1");
      const MAX_BUY_AMOUNT = 10;
      const TX_FEE = ethers.parseEther("0.01");
      const INITIAL_BASE_URI = 'https://sidekickfinance.mypinata.cloud/ipfs/QmVRVjmmK5bDJdpSXAyZ4iqQsR5q7w4tyDPTqhV21UiYTM';
  
      await mockToken.mint(addr1.address, ethers.parseEther("1000"));
      await mockToken.connect(addr1).approve(nft, ethers.MaxUint256);
  
      return { 
        nft, 
        mockToken, 
        owner, 
        addr1, 
        addr2, 
        feeCollector,
        BATCH_QUANTITY,
        BATCH_PRICE,
        MAX_BUY_AMOUNT,
        TX_FEE,
        INITIAL_BASE_URI
      };
    }
  
    describe("Deployment", function () {
      it("Should set the right owner", async function () {
        const { nft, owner } = await loadFixture(deployATLYARDFixture);
        expect(await nft.owner()).to.equal(owner.address);
      });
  
      it("Should set the correct payment token", async function () {
        const { nft, mockToken } = await loadFixture(deployATLYARDFixture);
        expect(await nft._paymentToken()).to.equal(mockToken);
      });
  
      it("Should set the correct fee collector", async function () {
        const { nft, owner } = await loadFixture(deployATLYARDFixture);
        expect(await nft._feeCollector()).to.equal(owner.address);
      });
  
      it("Should have correct initial values", async function () {
        const { nft } = await loadFixture(deployATLYARDFixture);
        const batch = await nft._currentBatch();
        expect(batch.quantity).to.equal(0);
        expect(batch.price).to.equal(0);
        expect(batch.active).to.be.false;
      });
    });
  
    describe("Base URI Management", function () {
      it("Should not allow non-owner to update base URI", async function () {
        const { nft, addr1 } = await loadFixture(deployATLYARDFixture);
        const newUri = "https://new-uri.com/";
        await expect(
          nft.connect(addr1).setBaseURI(newUri)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  
    describe("Batch Management", function () {
      it("Should create a new batch", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployATLYARDFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        const batch = await nft._currentBatch();
        
        expect(batch.quantity).to.equal(BATCH_QUANTITY);
        expect(batch.price).to.equal(BATCH_PRICE);
        expect(batch.active).to.be.true;
      });
  
      it("Should emit NewBatchCreated event", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployATLYARDFixture);
        
        await expect(nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true))
          .to.emit(nft, "NewBatchCreated")
          .withArgs(anyValue);  
      });
  
      it("Should not allow creating new batch if current one isn't finished", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployATLYARDFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await expect(
          nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true)
        ).to.be.revertedWith("Current batch not finished.");
      });
  
      it("Should toggle batch active status", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployATLYARDFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await nft.setCurrentBatchActive(false);
        const batch = await nft._currentBatch();
        expect(batch.active).to.be.false;
      });
    });
  
    describe("Minting", function () {
      it("Should mint tokens when paying correct amount", async function () {
        const { nft, mockToken, addr1, owner, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployATLYARDFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        const mintAmount = 2;
        await nft.connect(addr1).mint(mintAmount);
        
        expect(await nft.balanceOf(addr1.address)).to.equal(mintAmount);
        expect(await mockToken.balanceOf(owner.address)).to.equal(BATCH_PRICE * BigInt(mintAmount));
      });
  
      it("Should not mint when batch is inactive", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployATLYARDFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, false);
        await expect(
          nft.connect(addr1).mint(1)
        ).to.be.revertedWith("Current Batch is not active");
      });
  
      it("Should not mint more than max buy amount", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE, MAX_BUY_AMOUNT } = await loadFixture(
          deployATLYARDFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await expect(
          nft.connect(addr1).mint(MAX_BUY_AMOUNT + 1)
        ).to.be.revertedWith("Max buy amount limit hit");
      });
  
      it("Should allow free participants to mint without payment", async function () {
        const { nft, addr2, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployATLYARDFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await nft.setFreeParticipant(addr2.address, true);
        await nft.connect(addr2).mint(1);
        expect(await nft.balanceOf(addr2.address)).to.equal(1);
      });
  
      it("Should decrease batch quantity after minting", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployATLYARDFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        const mintAmount = 2;
        await nft.connect(addr1).mint(mintAmount);
        
        const batch = await nft._currentBatch();
        expect(batch.quantity).to.equal(BATCH_QUANTITY - mintAmount);
      });
    });
  
    describe("Fee Management", function () {
      // it("Should set transaction fee", async function () {
      //   const { nft, TX_FEE } = await loadFixture(deployATLYARDFixture);
        
      //   await nft.setTxFee(TX_FEE);
      //   expect(await nft._txFeeAmount()).to.equal(TX_FEE);
      // });
  
      it("Should update fee collector", async function () {
        const { nft, feeCollector } = await loadFixture(deployATLYARDFixture);
        
        await nft.setFeeCollector(feeCollector.address);
        expect(await nft._feeCollector()).to.equal(feeCollector.address);
      });
    });
  
    describe("Participant Management", function () {
      it("Should set free participant controller", async function () {
        const { nft, addr1 } = await loadFixture(deployATLYARDFixture);
        
        await nft.setFreeParticipantController(addr1.address, true);
        expect(await nft.freeParticipantControllers(addr1.address)).to.be.true;
      });
  
      it("Should set free participant", async function () {
        const { nft, addr1 } = await loadFixture(deployATLYARDFixture);
        
        await nft.setFreeParticipant(addr1.address, true);
        expect(await nft.freeParticipant(addr1.address)).to.be.true;
      });
    });
  });