import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import hre, { ethers } from "hardhat";
  
  describe("ACRE", function () {
    async function deployACREFixture() {
      const [owner, addr1, addr2, feeCollector] = await hre.ethers.getSigners();
  
      const MockERC20 = await hre.ethers.getContractFactory("BUSD");
      const mockToken = await MockERC20.deploy();
  
      const ACRE = await hre.ethers.getContractFactory("ACRE");
      const nft = await ACRE.deploy();
      await nft.initialize(mockToken.target);
  
      const BATCH_QUANTITY = 100;
      const BATCH_PRICE = ethers.parseEther("0.1");
      const MAX_BUY_AMOUNT = 10;
  
      await mockToken.mint(addr1.address, ethers.parseEther("1000"));
      await mockToken.connect(addr1).approve(nft.target, ethers.MaxUint256);
   
      const SIGNER_ROLE = await nft.SIGNER_ROLE();
      await nft.grantRole(SIGNER_ROLE, owner.address);
  
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
        SIGNER_ROLE
      };
    }
  
    describe("Initialization", function () {
      it("Should initialize with correct values", async function () {
        const { nft, mockToken, owner } = await loadFixture(deployACREFixture);
        
        expect(await nft._paymentToken()).to.equal(mockToken.target);
        expect(await nft._feeCollector()).to.equal(owner.address);
      });
  
      it("Should set up roles correctly", async function () {
        const { nft, owner, SIGNER_ROLE } = await loadFixture(deployACREFixture);
        
        expect(await nft.hasRole(SIGNER_ROLE, owner.address)).to.be.true;
      });
    });
  
    describe("Batch Management", function () {
      it("Should create a new batch", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployACREFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        const batch = await nft._currentBatch();
        
        expect(batch.quantity).to.equal(BATCH_QUANTITY);
        expect(batch.price).to.equal(BATCH_PRICE);
        expect(batch.active).to.be.true;
      });
  
      it("Should emit NewBatchCreated event", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployACREFixture);
        
        await expect(nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true))
          .to.emit(nft, "NewBatchCreated")
          .withArgs(anyValue);
      });
  
      it("Should not allow creating new batch if current one isn't finished", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployACREFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await expect(
          nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true)
        ).to.be.revertedWithCustomError(nft, "CurrentBactchNotFinished");
      });
  
      it("Should toggle batch active status", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployACREFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await nft.setCurrentBatchActive(false);
        const batch = await nft._currentBatch();
        expect(batch.active).to.be.false;
      });
    });
  
    describe("Minting", function () {
      it("Should mint tokens when paying correct amount", async function () {
        const { nft, mockToken, addr1, owner, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployACREFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        const mintAmount = 2;
        await nft.connect(addr1).mint(mintAmount);
        
        expect(await nft.balanceOf(addr1.address)).to.equal(mintAmount);
        expect(await mockToken.balanceOf(owner.address)).to.equal(BATCH_PRICE * BigInt(mintAmount));
      });
  
      it("Should not mint when batch is inactive", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployACREFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, false);
        await expect(
          nft.connect(addr1).mint(1)
        ).to.be.revertedWithCustomError(nft, "CurrentBatchNotActive");
      });
  
      it("Should not mint more than max buy amount", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE, MAX_BUY_AMOUNT } = await loadFixture(
          deployACREFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await expect(
          nft.connect(addr1).mint(MAX_BUY_AMOUNT + 1)
        ).to.be.revertedWithCustomError(nft, "MaxBuyAmountLimitReached");
      });
  
      it("Should allow free participants to mint without payment", async function () {
        const { nft, addr2, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployACREFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await nft.setFreeParticipant(addr2.address, true);
        await nft.connect(addr2).mint(1);
        expect(await nft.balanceOf(addr2.address)).to.equal(1);
      });
    });
  
    describe("Free Minting", function () {
      it("Should allow free minters to mint", async function () {
        const { nft, addr2, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployACREFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await nft.setFreeParticipant(addr2.address, true);
        await nft.connect(addr2).mintAsFreeMinter(1);
        expect(await nft.balanceOf(addr2.address)).to.equal(1);
      });
  
      it("Should reject non-free minters", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployACREFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await expect(
          nft.connect(addr1).mintAsFreeMinter(1)
        ).to.be.revertedWithCustomError(nft, "TransactionFailed");
      });
    });
  
    describe("Access Control", function () {
      it("Should only allow signer to create batch", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployACREFixture
        );
  
        await expect(
          nft.connect(addr1).setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true)
        ).to.be.revertedWithCustomError(nft, "UnAuthorized");
      });
  
      it("Should only allow signer to set free participant", async function () {
        const { nft, addr1, addr2 } = await loadFixture(deployACREFixture);
  
        await expect(
          nft.connect(addr1).setFreeParticipant(addr2.address, true)
        ).to.be.revertedWithCustomError(nft, "UnAuthorized");
      });
  
      it("Should only allow signer to set fee collector", async function () {
        const { nft, addr1, feeCollector } = await loadFixture(deployACREFixture);
  
        await expect(
          nft.connect(addr1).setFeeCollector(feeCollector.address)
        ).to.be.revertedWithCustomError(nft, "UnAuthorized");
      });
    });
  
    describe("Configuration", function () {
      it("Should update base URI", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployACREFixture
        );
  
        const newUri = "https://new-uri.com/";
        await nft.setBaseURI(newUri);
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await nft.connect(addr1).mint(1);
        expect(await nft.tokenURI(0)).to.equal(newUri);
      });
  
      it("Should update fee collector", async function () {
        const { nft, feeCollector } = await loadFixture(deployACREFixture);
        
        await nft.setFeeCollector(feeCollector.address);
        expect(await nft._feeCollector()).to.equal(feeCollector.address);
      });
  
      it("Should update transaction fee", async function () {
        const { nft } = await loadFixture(deployACREFixture);
        
        const newFee = ethers.parseEther("0.01");
        await nft.setTxFee(newFee);
      });
  
      it("Should update payment token", async function () {
        const { nft, addr1 } = await loadFixture(deployACREFixture);
        
        await nft.setPaymentToken(addr1.address);
        expect(await nft._paymentToken()).to.equal(addr1.address);
      });
    });
  });