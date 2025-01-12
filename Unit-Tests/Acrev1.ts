import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import hre, { ethers } from "hardhat";
  
  describe("ATLACRE", function () {
    async function deployATLACREFixture() {
      const [owner, addr1, addr2, feeCollector] = await hre.ethers.getSigners();
  
      const MockERC20 = await hre.ethers.getContractFactory("BUSD");
      const mockToken = await MockERC20.deploy();
  
      const ATLACRE = await hre.ethers.getContractFactory("ATLACRE");
      const nft = await ATLACRE.deploy(mockToken);
  
      const BATCH_QUANTITY = 100;
      const BATCH_PRICE = ethers.parseEther("0.1");
      const MAX_BUY_AMOUNT = 10;
  
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
        MAX_BUY_AMOUNT
      };
    }
  
    describe("Deployment", function () {
      it("Should set the right owner", async function () {
        const { nft, owner } = await loadFixture(deployATLACREFixture);
        expect(await nft.owner()).to.equal(owner.address);
      });
  
      it("Should set the correct payment token", async function () {
        const { nft, mockToken } = await loadFixture(deployATLACREFixture);
        expect(await nft._paymentToken()).to.equal(mockToken);
      });
  
      it("Should set the correct fee collector", async function () {
        const { nft, owner } = await loadFixture(deployATLACREFixture);
        expect(await nft._feeCollector()).to.equal(owner.address);
      });
    });
  
    describe("Batch Management", function () {
      it("Should create a new batch", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployATLACREFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        const batch = await nft._currentBatch();
        
        expect(batch.quantity).to.equal(BATCH_QUANTITY);
        expect(batch.price).to.equal(BATCH_PRICE);
        expect(batch.active).to.be.true;
      });
  
      it("Should emit NewBatchCreated event", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployATLACREFixture);
        
        await expect(nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true))
          .to.emit(nft, "NewBatchCreated")
          .withArgs(anyValue);  
      });
  
      it("Should not allow creating new batch if current one isn't finished", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployATLACREFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await expect(
          nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true)
        ).to.be.revertedWith("Current batch not finished.");
      });
  
      it("Should toggle batch active status", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployATLACREFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await nft.setCurrentBatchActive(false);
        const batch = await nft._currentBatch();
        expect(batch.active).to.be.false;
      });
    });
  
    describe("Minting", function () {
      it("Should mint tokens when paying correct amount", async function () {
        const { nft, mockToken, addr1, owner, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployATLACREFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        const mintAmount = 2;
        await nft.connect(addr1).mint(mintAmount);
        
        expect(await nft.balanceOf(addr1.address)).to.equal(mintAmount);
        expect(await mockToken.balanceOf(owner.address)).to.equal(BATCH_PRICE * BigInt(mintAmount));
      });
  
      it("Should not mint when batch is inactive", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployATLACREFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, false);
        await expect(
          nft.connect(addr1).mint(1)
        ).to.be.revertedWith("Current Batch is not active");
      });
  
      it("Should not mint more than max buy amount", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE, MAX_BUY_AMOUNT } = await loadFixture(
          deployATLACREFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await expect(
          nft.connect(addr1).mint(MAX_BUY_AMOUNT + 1)
        ).to.be.revertedWith("Max buy amount limit hit");
      });
  
      it("Should allow free participants to mint without payment", async function () {
        const { nft, addr2, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployATLACREFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await nft.setFreeParticipant(addr2.address, true);
        await nft.connect(addr2).mint(1);
        expect(await nft.balanceOf(addr2.address)).to.equal(1);
      });
    });
  
    describe("Configuration", function () {
      it("Should update base URI", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployATLACREFixture
        );
  
        const newUri = "https://new-uri.com/";
        await nft.setBaseURI(newUri);
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await nft.connect(addr1).mint(1);
        expect(await nft.tokenURI(0)).to.equal(newUri);
      });
  
      it("Should update fee collector", async function () {
        const { nft, feeCollector } = await loadFixture(deployATLACREFixture);
        
        await nft.setFeeCollector(feeCollector.address);
        expect(await nft._feeCollector()).to.equal(feeCollector.address);
      });
  
      it("Should set free participant controller", async function () {
        const { nft, addr1 } = await loadFixture(deployATLACREFixture);
        
        await nft.setFreeParticipantController(addr1.address, true);
        expect(await nft.freeParticipantControllers(addr1.address)).to.be.true;
      });
  
      it("Should update payment token", async function () {
        const { nft, addr1 } = await loadFixture(deployATLACREFixture);
        
        await nft.setPaymentToken(addr1.address);
        expect(await nft._paymentToken()).to.equal(addr1.address);
      });
    });
  });