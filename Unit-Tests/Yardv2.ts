import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import hre, { ethers } from "hardhat";
  
  describe("YARD", function () {
    async function deployYARDFixture() {
      const [owner, addr1, addr2, feeCollector] = await hre.ethers.getSigners();
  
      const MockERC20 = await hre.ethers.getContractFactory("BUSD");
      const mockToken = await MockERC20.deploy();
  
      const YARD = await hre.ethers.getContractFactory("YARD");
      const nft = await YARD.deploy();
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
      it("Should initialize with correct name and symbol", async function () {
        const { nft } = await loadFixture(deployYARDFixture);
        
        expect(await nft.name()).to.equal("EVT Yard");
        expect(await nft.symbol()).to.equal("yEVT");
      });
  
      it("Should initialize with correct values", async function () {
        const { nft, mockToken, owner } = await loadFixture(deployYARDFixture);
        
        expect(await nft._paymentToken()).to.equal(mockToken.target);
        expect(await nft._feeCollector()).to.equal(owner.address);
      });
  
      it("Should set up roles correctly", async function () {
        const { nft, owner, SIGNER_ROLE } = await loadFixture(deployYARDFixture);
        
        expect(await nft.hasRole(SIGNER_ROLE, owner.address)).to.be.true;
        expect(await nft.hasRole(await nft.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      });
    });
  
    describe("Batch Management", function () {
      it("Should create a new batch correctly", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployYARDFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        const batch = await nft._currentBatch();
        
        expect(batch.quantity).to.equal(BATCH_QUANTITY);
        expect(batch.price).to.equal(BATCH_PRICE);
        expect(batch.active).to.be.true;
        expect(batch.batch).to.equal(0);
      });
  
      it("Should track batch IDs correctly", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployYARDFixture);
        
        expect(await nft.nextBatchId()).to.equal(0);
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        expect(await nft.nextBatchId()).to.equal(1);
      });
  
      it("Should store batch history correctly", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployYARDFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        const storedBatch = await nft.allBatches(0);
        
        expect(storedBatch.quantity).to.equal(BATCH_QUANTITY);
        expect(storedBatch.price).to.equal(BATCH_PRICE);
        expect(storedBatch.active).to.be.true;
      });
  
      it("Should prevent creating new batch when current is not finished", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployYARDFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await expect(
          nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true)
        ).to.be.revertedWithCustomError(nft, "CurrentBactchNotFinished");
      });
  
      it("Should emit NewBatchCreated event with correct start index", async function () {
        const { nft, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployYARDFixture);
        
        await expect(nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true))
          .to.emit(nft, "NewBatchCreated")
          .withArgs(anyValue);
      });
    });
  
    describe("Minting", function () {
      it("Should mint tokens and transfer payment correctly", async function () {
        const { nft, mockToken, addr1, owner, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(
          deployYARDFixture
        );
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        const mintAmount = 2;
        await nft.connect(addr1).mint(mintAmount);
        
        expect(await nft.balanceOf(addr1.address)).to.equal(mintAmount);
        expect(await mockToken.balanceOf(owner.address)).to.equal(BATCH_PRICE * BigInt(mintAmount));
      });
  
      it("Should enforce minting restrictions correctly", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployYARDFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await expect(nft.connect(addr1).mint(0))
          .to.be.revertedWithCustomError(nft, "QuantityMustBeAboveZero");
  
        await nft.setCurrentBatchActive(false);
        await expect(nft.connect(addr1).mint(1))
          .to.be.revertedWithCustomError(nft, "CurrentBatchNotActive");
  
        await nft.setCurrentBatchActive(true);
        await expect(nft.connect(addr1).mint(11))
          .to.be.revertedWithCustomError(nft, "MaxBuyAmountLimitReached");
      });
  
      it("Should update batch quantity after minting", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployYARDFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        const mintAmount = 5;
        await nft.connect(addr1).mint(mintAmount);
        
        const batch = await nft._currentBatch();
        expect(batch.quantity).to.equal(BATCH_QUANTITY - mintAmount);
      });
  
      it("Should handle free participant minting correctly", async function () {
        const { nft, addr2, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployYARDFixture);
        
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await nft.setFreeParticipant(addr2.address, true);
        await nft.connect(addr2).mint(1);
        
        expect(await nft.balanceOf(addr2.address)).to.equal(1);
      });
    });
  
    describe("Free Minting Specific", function () {
      it("Should allow free minters to use mintAsFreeMinter", async function () {
        const { nft, addr2, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployYARDFixture);
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await nft.setFreeParticipant(addr2.address, true);
        await nft.connect(addr2).mintAsFreeMinter(1);
        expect(await nft.balanceOf(addr2.address)).to.equal(1);
      });
  
      it("Should enforce restrictions for mintAsFreeMinter", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployYARDFixture);
  
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        
        await expect(nft.connect(addr1).mintAsFreeMinter(1))
          .to.be.revertedWithCustomError(nft, "TransactionFailed")
          .withArgs("MustBeAFreeMinter");
  
        await nft.setFreeParticipant(addr1.address, true);
        await expect(nft.connect(addr1).mintAsFreeMinter(0))
          .to.be.revertedWithCustomError(nft, "TransactionFailed")
          .withArgs("QuantityMustBeAboveZero");
  
        await nft.setCurrentBatchActive(false);
        await expect(nft.connect(addr1).mintAsFreeMinter(1))
          .to.be.revertedWithCustomError(nft, "TransactionFailed")
          .withArgs("CurrentBatchNotActive");
      });
    });
  
    describe("Access Control", function () {
      it("Should enforce signer role for admin functions", async function () {
        const { nft, addr1, addr2, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployYARDFixture);
  
        await expect(nft.connect(addr1).setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true))
          .to.be.revertedWithCustomError(nft, "UnAuthorized");
        
        await expect(nft.connect(addr1).setBaseURI("test"))
          .to.be.revertedWithCustomError(nft, "UnAuthorized");
          
        await expect(nft.connect(addr1).setFreeParticipant(addr2.address, true))
          .to.be.revertedWithCustomError(nft, "UnAuthorized");
      });
  
      it("Should allow signer to set free participant controller", async function () {
        const { nft, addr1 } = await loadFixture(deployYARDFixture);
        
        await nft.setFreeParticipantController(addr1.address, true);
        expect(await nft.freeParticipantControllers(addr1.address)).to.be.true;
      });
    });
  
    describe("Configuration", function () {
      it("Should allow updating base URI", async function () {
        const { nft, addr1, BATCH_QUANTITY, BATCH_PRICE } = await loadFixture(deployYARDFixture);
  
        const newUri = "https://test-uri.com/";
        await nft.setBaseURI(newUri);
        await nft.setCurrentBatch(BATCH_QUANTITY, BATCH_PRICE, true);
        await nft.connect(addr1).mint(1);
        expect(await nft.tokenURI(0)).to.equal(newUri);
      });
  
      it("Should allow updating fee collector", async function () {
        const { nft, feeCollector } = await loadFixture(deployYARDFixture);
        
        await nft.setFeeCollector(feeCollector.address);
        expect(await nft._feeCollector()).to.equal(feeCollector.address);
      });
  
      it("Should allow updating transaction fee", async function () {
        const { nft } = await loadFixture(deployYARDFixture);
        
        const newFee = ethers.parseEther("0.01");
        await nft.setTxFee(newFee);
      });
    });
  });