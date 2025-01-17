import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { 
  Migrator,
  MockERC20,
  MockNFT 
} from "../typechain-types";
import { BigNumber } from "ethers";

describe("Migrator Contract", function () {
  let migrator: Migrator;
  let mockTokenV1: MockERC20;
  let mockTokenV2: MockERC20;
  let mockAcreV1: MockNFT;
  let mockAcreV2: MockNFT;
  let mockPlotV1: MockNFT;
  let mockPlotV2: MockNFT;
  let mockYardV1: MockNFT;
  let mockYardV2: MockNFT;
  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let user: SignerWithAddress;
  let addrs: SignerWithAddress[];

  const SIGNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SIGNER_ROLE"));
  const PRICE = ethers.parseEther("1");
  const ZERO_ADDRESS = ethers.AddressZero;

  beforeEach(async function () {
    // Get signers
    [owner, signer, user, ...addrs] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockTokenV1 = await MockERC20.deploy("TokenV1", "TV1");
    mockTokenV2 = await MockERC20.deploy("TokenV2", "TV2");

    // Deploy mock NFTs
    const MockNFT = await ethers.getContractFactory("MockNFT");
    mockAcreV1 = await MockNFT.deploy("AcreV1", "AV1");
    mockAcreV2 = await MockNFT.deploy("AcreV2", "AV2");
    mockPlotV1 = await MockNFT.deploy("PlotV1", "PV1");
    mockPlotV2 = await MockNFT.deploy("PlotV2", "PV2");
    mockYardV1 = await MockNFT.deploy("YardV1", "YV1");
    mockYardV2 = await MockNFT.deploy("YardV2", "YV2");

    const Migrator = await ethers.getContractFactory("Migrator");
    migrator = await upgrades.deployProxy(Migrator, []) as Migrator;

    await migrator.grantRole(SIGNER_ROLE, signer.address);

    await migrator.connect(signer).setERC721Requirements(
      mockAcreV1.address,
      mockYardV1.address,
      mockPlotV1.address,
      mockAcreV2.address,
      mockYardV2.address,
      mockPlotV2.address
    );

    await migrator.connect(signer).setTokenInfo(
      mockTokenV1.address,
      mockTokenV2.address,
      PRICE
    );

    await mockTokenV1.mint(user.address, ethers.parseEther("1000"));
    await mockTokenV2.mint(migrator, ethers.parseEther("1000"));
  });

  describe("Initialization", function () {
    it("Should initialize with correct admin", async function () {
      expect(await migrator.hasRole(await migrator.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should set correct signer role", async function () {
      expect(await migrator.hasRole(SIGNER_ROLE, signer.address)).to.be.true;
    });
  });

  describe("ERC20 Token Migration", function () {
    const migrationAmount = ethers.parseEther("100");

    beforeEach(async function () {
      await mockTokenV1.connect(user).approve(migrator, migrationAmount);
    });

    it("Should migrate tokens successfully", async function () {
      const initialBalanceV1 = await mockTokenV1.balanceOf(user.address);
      const initialBalanceV2 = await mockTokenV2.balanceOf(user.address);

      await expect(migrator.connect(user).migrateERC20Token(
        migrationAmount,
        mockTokenV1.address,
        mockTokenV2.address
      )).to.emit(migrator, "TokenMigrationCompleted");

      expect(await mockTokenV1.balanceOf(user.address)).to.equal(
        initialBalanceV1.sub(migrationAmount)
      );
      expect(await mockTokenV2.balanceOf(user.address)).to.equal(
        initialBalanceV2.add(migrationAmount.mul(PRICE))
      );
    });

    it("Should fail with insufficient allowance", async function () {
      await mockTokenV1.connect(user).approve(migrator, 0);
      await expect(
        migrator.connect(user).migrateERC20Token(
          migrationAmount,
          mockTokenV1.address,
          mockTokenV2.address
        )
      ).to.be.revertedWith("TransactionMessage");
    });
  });

  describe("NFT Migration", function () {
    beforeEach(async function () {
      
      await mockAcreV1.mint(user.address, 3);
      await mockPlotV1.mint(user.address, 2);
      await mockYardV1.mint(user.address, 1);

       
      await mockAcreV1.connect(user).setApprovalForAll(migrator, true);
      await mockPlotV1.connect(user).setApprovalForAll(migrator, true);
      await mockYardV1.connect(user).setApprovalForAll(migrator, true);
    });

    it("Should migrate multiple NFTs successfully", async function () {
      const acresToMigrate = [0, 1, 2];
      const plotsToMigrate = [0, 1];
      const yardsToMigrate = [0];

      await expect(
        migrator.connect(user).migrateAllAsset(
          acresToMigrate,
          plotsToMigrate,
          yardsToMigrate
        )
      ).to.emit(migrator, "NFTMigrationCompleted");

       
      for (let i = 0; i < 3; i++) {
        expect(await mockAcreV2.ownerOf(i)).to.equal(user.address);
      }
      for (let i = 0; i < 2; i++) {
        expect(await mockPlotV2.ownerOf(i)).to.equal(user.address);
      }
      expect(await mockYardV2.ownerOf(0)).to.equal(user.address);
    });

    it("Should fail when trying to migrate non-owned NFTs", async function () {
      await expect(
        migrator.connect(addrs[0]).migrateAllAsset([0], [], [])
      ).to.be.revertedWith("TransactionMessage");
    });
  });

  describe("Batch Migration", function () {
    beforeEach(async function () {
       
      for (let i = 0; i < 200; i++) {
        await mockAcreV1.mint(user.address, 1);
      }
      await mockAcreV1.connect(user).setApprovalForAll(migrator, true);
    });

    it("Should handle large batch migrations", async function () {
      const tokenIds = Array.from({ length: 200 }, (_, i) => i);
      
       
      const batchSize = 50;
      for (let i = 0; i < tokenIds.length; i += batchSize) {
        const batch = tokenIds.slice(i, i + batchSize);
        await expect(
          migrator.connect(user).migrateAllAsset(batch, [], [])
        ).to.emit(migrator, "NFTMigrationCompleted");

        for (let j = 0; j < batch.length; j++) {
          expect(await mockAcreV2.ownerOf(i + j)).to.equal(user.address);
        }
      }
    });
  });

  describe("Admin Functions", function () {
    it("Should allow signer to update requirements", async function () {
      await expect(
        migrator.connect(signer).setERC721Requirements(
          mockAcreV1.address,
          mockYardV1.address,
          mockPlotV1.address,
          mockAcreV2.address,
          mockYardV2.address,
          mockPlotV2.address
        )
      ).to.not.be.reverted;
    });

    it("Should prevent non-signer from updating requirements", async function () {
      await expect(
        migrator.connect(user).setERC721Requirements(
          mockAcreV1.address,
          mockYardV1.address,
          mockPlotV1.address,
          mockAcreV2.address,
          mockYardV2.address,
          mockPlotV2.address
        )
      ).to.be.revertedWith("TransactionMessage");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero token migrations", async function () {
      await expect(
        migrator.connect(user).migrateERC20Token(0, mockTokenV1.address, mockTokenV2.address)
      ).to.be.revertedWith("TransactionMessage");
    });

    it("Should handle empty NFT arrays", async function () {
      await expect(
        migrator.connect(user).migrateAllAsset([], [], [])
      ).to.be.revertedWith("TransactionMessage");
    });
  });
});