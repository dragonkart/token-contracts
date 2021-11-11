const { accounts, contract } = require("@openzeppelin/test-environment");
const {
    BN,
    expectEvent,
    expectRevert,
    time,
} = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const config = require("config");

const [owner, admin, investor1, investor2] = accounts;

const DragonKart = contract.fromArtifact("DragonKart");
const Vesting = contract.fromArtifact("TokensVesting");

// time by months
const CAP = config.get("cap");
const TimePhase = config.get("timePhase");
const TokenOfTeam = config.get("tokenOfTeam");
const TgeOfTeam = config.get("tgeOfTeam");
const CliffOfTeam = config.get("cliffOfTeam");
const DurationOfTeam = config.get("durationOfTeam");
const Participant = config.get("participant");
const GAP = config.get("gap");
const decimalString = config.get("decimalString");
const tokenName = config.get("tọkenName");
const tokenSymbol = config.get("tọkenSymbol");
const timeElapsedAfterDeployVestingContract = "100000";
const minterRole = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"

describe("TokensVesting", function () {
    beforeEach(async function () {
        this.tokenContract = await DragonKart.new(tokenName, tokenSymbol, {
            from: owner,
        });
        this.erc20Address = await this.tokenContract.address;
        const latestBlockTime = await time.latest();
        this.genesisTimestamp = latestBlockTime.add(
            new BN(timeElapsedAfterDeployVestingContract)
        );
        this.vestingContract = await Vesting.new(this.erc20Address, {
            from: admin,
        });
        const vestingAddress = await this.vestingContract.address;
        await this.tokenContract.grantRole(minterRole, vestingAddress, {
            from: owner,
        });
        this.total = new BN(0);
    });

    it("verify token address", async function () {
        const tokenAddress = await this.vestingContract.token();
        expect(this.erc20Address, "should equal tokenAddress").to.equal(
            tokenAddress
        );
        expect(this.erc20Address, "should not equal address 0x0").to.not.equal(
            "0x000000000000000000000000000000000"
        );
    });

    it("getBeneficiary", async function () {
        await expectRevert.unspecified(this.vestingContract.getBeneficiary(0));
    });

    it("addBeneficiary", async function () {
        const totalAmount1 = new BN(13000000);
        this.total = this.total + totalAmount1;
        const tge1 = new BN(1000000);
        const cliff1 = new BN(2 * 30 * 24 * 60 * 60);
        const duration1 = new BN(12 * 30 * 24 * 60 * 60);
        const participant1 = new BN(1);
        const transaction = await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        const revertTrx = this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: investor2,
            }
        );
        await expectRevert(revertTrx, "Ownable: caller is not the owner");
        expectEvent(transaction, "BeneficiaryAdded", {
            beneficiary: investor1,
            amount: totalAmount1,
        });
        const getBeneficiary = await this.vestingContract.getBeneficiary(0);
        const { beneficiary, totalAmount, tgeAmount, cliff, duration } =
            getBeneficiary;
        expect(investor1, "should equal investor1").to.equal(beneficiary);
        expect(totalAmount1.toString(), "should equal totalAmount1").to.equal(
            totalAmount.toString()
        );
        expect(tge1.toString(), "should equal tge1").to.equal(
            tgeAmount.toString()
        );
        expect(cliff1.toString(), "should equal cliff").to.equal(
            cliff.toString()
        );
        expect(duration1.toString(), "should equal duration").to.equal(
            duration.toString()
        );
    });

    it("addBeneficiaryWithBasis", async function () {
        const totalAmount1 = new BN(13000000);
        this.total = this.total + totalAmount1;
        const tge1 = new BN(1000000);
        const cliff1 = new BN(2 * 30 * 24 * 60 * 60);
        const duration1 = new BN(12 * 30 * 24 * 60 * 60);
        const participant1 = new BN(1);
        const basis1 = new BN(7 * 24 * 60 * 60);
        const transaction = await this.vestingContract.addBeneficiaryWithBasis(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            basis1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        const revertTrx = this.vestingContract.addBeneficiaryWithBasis(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            basis1,
            {
                from: investor2,
            }
        );
        await expectRevert(revertTrx, "Ownable: caller is not the owner");
        expectEvent(transaction, "BeneficiaryAdded", {
            beneficiary: investor1,
            amount: totalAmount1,
        });
        const getBeneficiary = await this.vestingContract.getBeneficiary(0);
        const { beneficiary, totalAmount, tgeAmount, cliff, duration, basis } =
            getBeneficiary;
        expect(investor1, "should equal investor1").to.equal(beneficiary);
        expect(totalAmount1.toString(), "should equal totalAmount1").to.equal(
            totalAmount.toString()
        );
        expect(tge1.toString(), "should equal tge1").to.equal(
            tgeAmount.toString()
        );
        expect(cliff1.toString(), "should equal cliff").to.equal(
            cliff.toString()
        );
        expect(duration1.toString(), "should equal duration").to.equal(
            duration.toString()
        );
        expect(basis1.toString(), "should equal basis").to.equal(
            basis.toString()
        );
    });

    it("total", async function () {
        const totalAmount1 = new BN(13000000);
        const tge1 = new BN(1000000);
        const cliff1 = new BN(2 * 30 * 24 * 60 * 60);
        const duration1 = new BN(12 * 30 * 24 * 60 * 60);
        const participant1 = new BN(1);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        const total = new BN(await this.vestingContract.total());
        expect(total.toString(), "should equal total").to.equal(
            totalAmount1.toString()
        );
    });

    it("privateSale", async function () {
        const totalAmount1 = new BN(13000000);
        const tge1 = new BN(1000000);
        const cliff1 = new BN(2 * 30 * 24 * 60 * 60);
        const duration1 = new BN(12 * 30 * 24 * 60 * 60);
        const participant1 = new BN(Participant.PrivateSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        const privateSale = await this.vestingContract.privateSale();
        expect(privateSale.toString()).to.equal(totalAmount1.toString());
    });

    it("publicSale", async function () {
        const totalAmount1 = new BN(TokenOfTeam.PublicSale);
        const tge1 = new BN("0");
        const cliff1 = new BN("0");
        const duration1 = new BN(TimePhase["3"]);
        const participant1 = new BN(Participant.PublicSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        const publicSale = await this.vestingContract.publicSale();
        expect(publicSale.toString()).to.equal(totalAmount1.toString());
    });

    it("team", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Team);
        const tge = new BN("0");
        const cliff = new BN("31104000");
        const duration = new BN("93312000");
        const participant = new BN(Participant.Team);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract;
        const team = await this.vestingContract.team();
        expect(team.toString()).to.equal(totalAmount1.toString());
    });

    it("advisor", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Advisor);
        const tge1 = new BN(0);
        const cliff1 = new BN(TimePhase["6"]);
        const duration1 = new BN(TimePhase["36"]);
        const participant1 = new BN(Participant.Advisor);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        const advisor = await this.vestingContract.advisor();
        expect(advisor.toString()).to.equal(totalAmount1.toString());
    });

    it("liquidity", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Liquidity);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.Liquidity);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        const liquidity = await this.vestingContract.liquidity();
        expect(liquidity.toString()).to.equal(totalAmount1.toString());
    });

    it("incentives", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Incentives);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.Incentives);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        const incentives = await this.vestingContract.incentives();
        expect(incentives.toString()).to.equal(totalAmount1.toString());
    });

    it("marketing", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Marketing);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.Marketing);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        const marketing = await this.vestingContract.marketing();
        expect(marketing.toString()).to.equal(totalAmount1.toString());
    });

    it("reserve", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Reserve);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.Reserve);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        const reserve = await this.vestingContract.reserve();
        expect(reserve.toString()).to.equal(totalAmount1.toString());
    });

    it("active", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Reserve);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.Reserve);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        const reserve = await this.vestingContract.reserve();
        expect(reserve.toString()).to.equal(totalAmount1.toString());
    });

    it("active after tge", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Marketing);
        const tge1 = new BN("1000000");
        const cliff1 = new BN(TimePhase["1"]);
        const duration1 = new BN(TimePhase["6"]);
        const participant1 = new BN(Participant.Marketing);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
    });

    it("active all", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Reserve);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.Reserve);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activateAll({ from: admin });
        const reserve = await this.vestingContract.reserve();
        expect(reserve.toString()).to.equal(totalAmount1.toString());
    });

    it("activatePrivateSale", async function () {
        const totalAmount1 = new BN(TokenOfTeam.PrivateSale);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.PrivateSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activatePrivateSale({ from: admin });
        const privateSale = await this.vestingContract.privateSale();
        expect(privateSale.toString()).to.equal(totalAmount1.toString());
    });

    it("activatePublicSale", async function () {
        const totalAmount1 = new BN(TokenOfTeam.PublicSale);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.PublicSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activatePublicSale({ from: admin });
        const publicSale = await this.vestingContract.publicSale();
        expect(publicSale.toString()).to.equal(totalAmount1.toString());
    });

    it("activateTeam", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Team);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.Team);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activateTeam({ from: admin });
        const team = await this.vestingContract.team();
        expect(team.toString()).to.equal(totalAmount1.toString());
    });

    it("activateAdvisor", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Advisor);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.Advisor);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activateAdvisor({ from: admin });
        const advisor = await this.vestingContract.advisor();
        expect(advisor.toString()).to.equal(totalAmount1.toString());
    });

    it("activateLiquidity", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Liquidity);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.Liquidity);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activateLiquidity({ from: admin });
        const liquidity = await this.vestingContract.liquidity();
        expect(liquidity.toString()).to.equal(totalAmount1.toString());
    });

    it("activateIncentives", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Incentives);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.Incentives);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activateIncentives({ from: admin });
        const incentives = await this.vestingContract.incentives();
        expect(incentives.toString()).to.equal(totalAmount1.toString());
    });

    it("activateMarketing", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Marketing);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.Marketing);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activateMarketing({ from: admin });
        const marketing = await this.vestingContract.marketing();
        expect(marketing.toString()).to.equal(totalAmount1.toString());
    });

    it("activateReserve", async function () {
        const totalAmount1 = new BN(TokenOfTeam.Reserve);
        const tge1 = new BN(0);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.Reserve);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activateReserve({ from: admin });
        const reserve = await this.vestingContract.reserve();
        expect(reserve.toString()).to.equal(totalAmount1.toString());
    });

    it("releasable", async function () {
        const totalAmount1 = new BN(10000000);
        const tge1 = new BN(1000000);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.PrivateSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const releasable = await this.vestingContract.releasable();
        expect(releasable.toString()).to.equal(tge1.toString());
    });

    it("releasable index", async function () {
        const totalAmount1 = new BN(10000000);
        const tge1 = new BN(1000000);
        const cliff1 = new BN(12);
        const duration1 = new BN(36);
        const participant1 = new BN(Participant.PrivateSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount1,
            tge1,
            cliff1,
            duration1,
            participant1,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const releasableIndex = await this.vestingContract.releasable(0);
        expect(releasableIndex.toString()).to.equal(tge1.toString());
    });

    it("privateSaleReleasable", async function () {
        const totalAmount = new BN(10000000);
        const tge = new BN(1000000);
        const cliff = new BN(12);
        const duration = new BN(36);
        const participant = new BN(Participant.PrivateSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const privateSaleReleasable =
            await this.vestingContract.privateSaleReleasable();
        expect(privateSaleReleasable.toString()).to.equal(tge.toString());
    });

    it("teamReleasable", async function () {
        const totalAmount = new BN(TokenOfTeam.Team);
        const tge = new BN(0);
        const cliff = new BN("31104000"); // 12 * 30 * 24 * 60 * 60 = 31104000
        const duration = new BN("93312000"); // 36 * 30 * 24 * 60 * 60 = 93312000
        const participant = new BN(Participant.Team);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const teamReleasable = await this.vestingContract.teamReleasable();
        expect(teamReleasable.toString()).to.equal("0");
    });

    it("advisorReleasable", async function () {
        const totalAmount = new BN("5000000000000000000000000");
        const tge = new BN(0);
        const cliff = new BN("15552000"); // 6 * 30 * 24 * 60 * 60 = 15552000
        const duration = new BN("46656000"); // 18 * 30 * 24 * 60 * 60 = 46656000
        const participant = new BN(Participant.Advisor);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const advisorReleasable =
            await this.vestingContract.advisorReleasable();
        expect(advisorReleasable.toString()).to.equal("0");
    });

    it("liquidityReleasable", async function () {
        const totalAmount = new BN(TokenOfTeam.Liquidity);
        const tge = new BN("5000000");
        const cliff = new BN(0);
        const duration = new BN(0);
        const participant = new BN(Participant.Liquidity);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const liquidityReleasable =
            await this.vestingContract.liquidityReleasable();
        expect(liquidityReleasable.toString()).to.equal(totalAmount.toString());
    });

    it("incentivesReleasable", async function () {
        const totalAmount = new BN(TokenOfTeam.Incentives);
        const tge = new BN(0);
        const cliff = new BN(0);
        const duration = new BN(TimePhase[47]);
        const participant = new BN(Participant.Incentives);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const incentivesReleasable =
            await this.vestingContract.incentivesReleasable();
        expect(incentivesReleasable.toString()).to.equal("729166");
    });

    it("marketingReleasable", async function () {
        const totalAmount = new BN(TokenOfTeam.Marketing);
        const tge = new BN(0);
        const cliff = new BN(0);
        const duration = new BN(TimePhase["35"]); // 36 * 30 * 24 * 60 * 60 = 124416000
        const participant = new BN(Participant.Marketing);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const amount = totalAmount.div(
            duration.div(new BN(GAP)).add(new BN(1))
        );
        const marketingReleasable =
            await this.vestingContract.marketingReleasable();
        expect(marketingReleasable.toString()).to.equal(amount.toString());
    });

    it("reserveReleasable", async function () {
        const totalAmount = new BN(TokenOfTeam.Reserve);
        const tge = new BN(0);
        const cliff = new BN("7776000"); // 3 * 30 * 24 * 60 * 60 = 7776000
        const duration = new BN("124416000"); // 48 * 30 * 24 * 60 * 60 = 124416000
        const participant = new BN(Participant.Reserve);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const amount = 0;
        const reserveReleasable =
            await this.vestingContract.reserveReleasable();
        expect(reserveReleasable.toString()).to.equal(amount.toString());
    });

    it("revoke", async function () {
        const totalAmount = new BN(TokenOfTeam.Reserve);
        const tge = new BN(0);
        const cliff = new BN("7776000"); // 3 * 30 * 24 * 60 * 60 = 7776000
        const duration = new BN("124416000"); // 48 * 30 * 24 * 60 * 60 = 124416000
        const participant = new BN(Participant.Reserve);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        const getBeneficiary = await this.vestingContract.getBeneficiary(0, {
            from: admin,
        });
        expect(getBeneficiary.status).to.equal("0");

        await this.vestingContract.activate(0, { from: admin });
        const getBeneficiary2 = await this.vestingContract.getBeneficiary(0, {
            from: admin,
        });
        expect(getBeneficiary2.status).to.equal("1");

        await this.vestingContract.revoke(0, { from: admin });
        const getBeneficiary3 = await this.vestingContract.getBeneficiary(0, {
            from: admin,
        });
        expect(getBeneficiary3.status).to.equal("2");
    });

    it("withdraw", async function () {
        const totalAmount = new BN(TokenOfTeam.Reserve);
        const tge = new BN(0);
        const cliff = new BN("7776000"); // 3 * 30 * 24 * 60 * 60 = 7776000
        const duration = new BN("124416000"); // 48 * 30 * 24 * 60 * 60 = 124416000
        const participant = new BN(Participant.Reserve);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );

        await this.vestingContract.activate(0, { from: admin });
        await this.vestingContract.revoke(0, { from: admin });

        const withdraw = await this.vestingContract.withdraw(totalAmount, {
            from: admin,
        });
        expectEvent(withdraw, "Withdraw", {
            receiver: admin,
            amount: totalAmount,
        });

        const balance = await this.tokenContract.balanceOf(admin);
        expect(balance.toString()).to.equal(totalAmount.toString());
    });

    // it("emergencyWithdraw", async function () {
    //     const emergencyWithdraw = await this.vestingContract.emergencyWithdraw({
    //         from: admin,
    //     });
    //     expectEvent(emergencyWithdraw, "EmergencyWithdraw", {
    //         receiver: admin,
    //         amount: CAP,
    //     });

    //     const balance = await this.tokenContract.balanceOf(admin);
    //     expect(balance.toString()).to.equal(CAP);
    // });

    it("releaseAll", async function () {
        const totalAmount = new BN("1000000000000000000000000");
        const tge = new BN("300000000000000000000000");
        const cliff = new BN("5184000");
        const duration = new BN("7776000");
        const participant = new BN(Participant.PrivateSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const response = await this.vestingContract.releaseAll({ from: admin });
        expectEvent(response, "TokensReleased", {
            beneficiary: investor1,
            amount: tge,
        });
        const balance = await this.tokenContract.balanceOf(investor1);
        expect(balance.toString()).to.equal(tge.toString());
    });

    it("releasePrivateSale", async function () {
        const totalAmount = new BN("1000000000000000000000000");
        const tge = new BN("300000000000000000000000");
        const cliff = new BN("5184000");
        const duration = new BN("7776000");
        const participant = new BN(Participant.PrivateSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const response = await this.vestingContract.releasePrivateSale({
            from: admin,
        });
        expectEvent(response, "TokensReleased", {
            beneficiary: investor1,
            amount: tge,
        });
        const balance = await this.tokenContract.balanceOf(investor1);
        expect(balance.toString()).to.equal(tge.toString());
    });

    it("releasePublicSale", async function () {
        const totalAmount = new BN(TokenOfTeam.PublicSale);
        const tge = new BN("0");
        const cliff = new BN("0");
        const duration = new BN(TimePhase["2"]);
        const participant = new BN(Participant.PublicSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const amount = totalAmount.div(new BN(TimePhase["3"]).div(new BN(GAP)));
        const response = await this.vestingContract.releasePublicSale({
            from: admin,
        });
        expectEvent(response, "TokensReleased", {
            beneficiary: investor1,
            amount,
        });
        const balance = await this.tokenContract.balanceOf(investor1);
        expect(balance.toString()).to.equal(amount.toString());
    });

    it("releaseTeam", async function () {
        const totalAmount = new BN(TokenOfTeam.Team);
        const tge = new BN("0");
        const cliff = new BN("31104000"); // 12 * 30 * 24 * 60 * 60 = 31104000
        const duration = new BN(TimePhase["35"]); // 36 * 30 * 24 * 60 * 60 = 93312000
        const participant = new BN(Participant.Team);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await time.increase("31104000");
        const response = await this.vestingContract.releaseTeam({
            from: admin,
        });
        const amount = totalAmount.div(
            duration.div(new BN(GAP)).add(new BN(1))
        );
        const balance = await this.tokenContract.balanceOf(investor1);
        expectEvent(response, "TokensReleased", {
            beneficiary: investor1,
            amount: amount,
        });
        expect(balance.toString()).to.equal(amount.toString());
    });

    it("releaseAdvisor", async function () {
        const totalAmount = new BN("50000000");
        const tge = new BN("0");
        const cliff = new BN(TimePhase["6"]);
        const duration = new BN(TimePhase["17"]);
        const participant = new BN(Participant.Advisor);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await time.increase(TimePhase["6"]);
        const response = await this.vestingContract.releaseAdvisor({
            from: admin,
        });
        const amount = totalAmount.div(
            duration.div(new BN(GAP)).add(new BN(1))
        );
        const balance = await this.tokenContract.balanceOf(investor1);
        expectEvent(response, "TokensReleased", {
            beneficiary: investor1,
            amount: amount,
        });
        expect(balance.toString()).to.equal(amount.toString());
    });

    it("releaseLiquidity", async function () {
        const totalAmount = new BN(TokenOfTeam.Liquidity);
        const tge = new BN("5000000");
        const cliff = new BN("0");
        const duration = new BN("0");
        const participant = new BN(Participant.Liquidity);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const response = await this.vestingContract.releaseLiquidity({
            from: admin,
        });
        const amount = totalAmount;
        const balance = await this.tokenContract.balanceOf(investor1);
        expectEvent(response, "TokensReleased", {
            beneficiary: investor1,
            amount: amount,
        });
        expect(balance.toString()).to.equal(amount.toString());
    });

    it("releaseIncentives", async function () {
        const totalAmount = new BN(TokenOfTeam.Incentives);
        const tge = new BN("0");
        const cliff = new BN("0");
        const duration = new BN(TimePhase["47"]);
        const participant = new BN(Participant.Incentives);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const response = await this.vestingContract.releaseIncentives({
            from: admin,
        });
        const amount = totalAmount.div(
            duration.div(new BN(GAP)).add(new BN(1))
        );
        const balance = await this.tokenContract.balanceOf(investor1);
        expectEvent(response, "TokensReleased", {
            beneficiary: investor1,
            amount: amount,
        });
        expect(balance.toString()).to.equal(amount.toString());
    });

    it("releaseMarketing", async function () {
        const totalAmount = new BN(TokenOfTeam.Marketing);
        const tge = new BN("0");
        const cliff = new BN("0");
        const duration = new BN(TimePhase["35"]);
        const participant = new BN(Participant.Marketing);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const response = await this.vestingContract.releaseMarketing({
            from: admin,
        });
        const amount = totalAmount.div(
            duration.div(new BN(GAP)).add(new BN(1))
        );
        const balance = await this.tokenContract.balanceOf(investor1);
        expectEvent(response, "TokensReleased", {
            beneficiary: investor1,
            amount: amount,
        });
        expect(balance.toString()).to.equal(amount.toString());
    });

    it("releaseReserve", async function () {
        const totalAmount = new BN(TokenOfTeam.Reserve);
        const tge = new BN("0");
        const cliff = new BN(TimePhase["3"]);
        const duration = new BN(TimePhase["47"]);
        const participant = new BN(Participant.Reserve);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await time.increase(TimePhase["3"]);
        const response = await this.vestingContract.releaseReserve({
            from: admin,
        });
        const amount = totalAmount.div(
            duration.div(new BN(GAP)).add(new BN(1))
        );
        const balance = await this.tokenContract.balanceOf(investor1);
        expectEvent(response, "TokensReleased", {
            beneficiary: investor1,
            amount: amount,
        });
        expect(balance.toString()).to.equal(amount.toString());
    });

    it("release", async function () {
        const totalAmount = new BN("10000000000000000000000000");
        const tge = new BN("0");
        const cliff = new BN(TimePhase["3"]);
        const duration = new BN(TimePhase["47"]);
        const participant = new BN(Participant.Reserve);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await time.increase(TimePhase["3"]);
        const response = await this.vestingContract.release(0, {
            from: investor1,
        });
        const amount = totalAmount.div(
            duration.div(new BN(GAP)).add(new BN(1))
        );
        const balance = await this.tokenContract.balanceOf(investor1);
        expectEvent(response, "TokensReleased", {
            beneficiary: investor1,
            amount: amount,
        });
        expect(balance.toString()).to.equal(amount.toString());
    });

    it("released", async function () {
        const totalAmount = new BN("10000000000000000000000000");
        const tge = new BN("0");
        const cliff = new BN(TimePhase["3"]);
        const duration = new BN(TimePhase["48"]);
        const participant = new BN(Participant.Reserve);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await time.increase(TimePhase["3"]);
        const balance = await this.tokenContract.balanceOf(investor1);
        const released = await this.vestingContract.released();
        expect(released.toString(), "balance should equal released").to.equal(
            balance.toString()
        );
    });

    it("privateSaleReleased", async function () {
        const totalAmount = new BN("1000000000000000000000000");
        const tge = new BN("300000000000000000000000");
        const cliff = new BN(TimePhase["2"]); // 2 * 30 * 24 * 60 * 60 = 5184000
        const duration = new BN(TimePhase["3"]); // 3 * 30 * 24 * 60 * 60 = 7776000
        const participant = new BN(Participant.PrivateSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await this.vestingContract.releasePrivateSale({ from: admin });
        const balance = await this.tokenContract.balanceOf(investor1);
        expect(balance.toString()).not.to.equal("0");
        expect(balance.toString()).to.equal(tge.toString());
        const privateSaleReleased =
            await this.vestingContract.privateSaleReleased();
        expect(privateSaleReleased.toString()).to.equal(balance.toString());
    });

    it("publicSaleReleased", async function () {
        const totalAmount = new BN(TokenOfTeam.PublicSale);
        const tge = new BN("1333200");
        const cliff = new BN("0"); // 2 * 30 * 24 * 60 * 60 = 5184000
        const duration = new BN(TimePhase["2"]); // 3 * 30 * 24 * 60 * 60 = 7776000
        const participant = new BN(Participant.PublicSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await this.vestingContract.releasePublicSale({ from: admin });
        const balance = await this.tokenContract.balanceOf(investor1);
        const publicSaleReleased =
            await this.vestingContract.publicSaleReleased();
        expect(publicSaleReleased.toString()).to.equal(balance.toString());
    });

    it("teamReleased", async function () {
        const totalAmount = new BN(TokenOfTeam.Team);
        const tge = new BN("0");
        const cliff = new BN("31104000"); // 12 * 30 * 24 * 60 * 60 = 31104000
        const duration = new BN("93312000"); // 36 * 30 * 24 * 60 * 60 = 93312000
        const participant = new BN(Participant.Team);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await time.increase("31104000");
        await this.vestingContract.releaseTeam({ from: admin });
        const balance = await this.tokenContract.balanceOf(investor1);
        expect(balance.toString(), "balance should not equal 0").not.to.equal(
            "0"
        );
        const teamReleased = await this.vestingContract.teamReleased();
        expect(
            teamReleased.toString(),
            "teamReleased not equal balance"
        ).to.equal(balance.toString());
    });

    it("advisorReleased", async function () {
        const totalAmount = new BN(TokenOfTeam.Advisor);
        const tge = new BN("0");
        const cliff = new BN(TimePhase["6"]);
        const duration = new BN(TimePhase["18"]);
        const participant = new BN(Participant.Advisor);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await time.increase(TimePhase["6"]);
        await this.vestingContract.releaseAdvisor({ from: admin });
        const balance = await this.tokenContract.balanceOf(investor1);
        expect(balance.toString(), "balance should not equal 0").not.to.equal(
            "0"
        );
        const advisorReleased = await this.vestingContract.advisorReleased();
        expect(
            advisorReleased.toString(),
            "advisorReleased not equal balance"
        ).to.equal(balance.toString());
    });

    it("liquidityReleased", async function () {
        const totalAmount = new BN(TokenOfTeam.Liquidity);
        const tge = new BN("5000000");
        const cliff = new BN("0");
        const duration = new BN("0");
        const participant = new BN(Participant.Liquidity);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await this.vestingContract.releaseLiquidity({ from: admin });
        const balance = await this.tokenContract.balanceOf(investor1);
        expect(balance.toString(), "balance should not equal 0").not.to.equal(
            "0"
        );
        const liquidityReleased =
            await this.vestingContract.liquidityReleased();
        expect(
            liquidityReleased.toString(),
            "liquidityReleased not equal balance"
        ).to.equal(balance.toString());
    });

    it("incentivesReleased", async function () {
        const totalAmount = new BN(TokenOfTeam.Incentives);
        const tge = new BN("0");
        const cliff = new BN("0");
        const duration = new BN(TimePhase["48"]);
        const participant = new BN(Participant.Incentives);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await this.vestingContract.releaseIncentives({ from: admin });
        const balance = await this.tokenContract.balanceOf(investor1);
        expect(balance.toString(), "balance should not equal 0").not.to.equal(
            "0"
        );
        const incentivesReleased =
            await this.vestingContract.incentivesReleased();
        expect(
            incentivesReleased.toString(),
            "incentivesReleased not equal balance"
        ).to.equal(balance.toString());
    });

    it("marketingReleased", async function () {
        const totalAmount = new BN(TokenOfTeam.Marketing);
        const tge = new BN("0");
        const cliff = new BN("0");
        const duration = new BN(TimePhase["36"]);
        const participant = new BN(Participant.Marketing);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await this.vestingContract.releaseMarketing({ from: admin });
        const balance = await this.tokenContract.balanceOf(investor1);
        expect(balance.toString(), "balance should not equal 0").not.to.equal(
            "0"
        );
        const marketingReleased =
            await this.vestingContract.marketingReleased();
        expect(
            marketingReleased.toString(),
            "marketingReleased not equal balance"
        ).to.equal(balance.toString());
    });

    it("reserveReleased", async function () {
        const totalAmount = new BN(TokenOfTeam.Reserve);
        const tge = new BN("0");
        const cliff = new BN(TimePhase["3"]);
        const duration = new BN(TimePhase["48"]);
        const participant = new BN(Participant.Reserve);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await time.increase(TimePhase["3"]);
        await this.vestingContract.releaseReserve({ from: admin });
        const balance = await this.tokenContract.balanceOf(investor1);
        expect(balance.toString(), "balance should not equal 0").not.to.equal(
            "0"
        );
        const reserveReleased = await this.vestingContract.reserveReleased();
        expect(
            reserveReleased.toString(),
            "reserveReleased not equal balance"
        ).to.equal(balance.toString());
    });

    it("release by month", async function () {
        const releaseTestVector = config.get("releasePrivateSaleByMonth");
        await Promise.all([
            releaseTestVector.forEach(async (vector, index) => {
                const {
                    total,
                    tge,
                    cliff,
                    duration,
                    elapsedTime,
                    releasable: releasableExpect,
                } = vector;
                const participant = new BN(Participant.PrivateSale);
                await this.vestingContract.addBeneficiary(
                    investor1,
                    this.genesisTimestamp,
                    new BN(total),
                    new BN(tge),
                    new BN(cliff),
                    new BN(duration),
                    participant,
                    {
                        from: admin,
                    }
                );
                await time.increase(timeElapsedAfterDeployVestingContract);
                await time.increase(elapsedTime);
                await this.vestingContract.activatePrivateSale({ from: admin });
                const releasable =
                    await this.vestingContract.privateSaleReleasable();
                expect(releasable.toString()).to.equal(releasableExpect);
            }),
        ]);
    });

    it("release private sale monthly", async function () {
        const releasePrivateMonthly = config.get("releasePrivateMonthly");
        const { total, tge, cliff, duration, releasableMonthly } =
            releasePrivateMonthly;
        let released = new BN(0);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            new BN(total),
            new BN(tge),
            new BN(cliff),
            new BN(duration),
            Participant.PrivateSale,
            {
                from: admin,
            }
        );
        await this.vestingContract.activatePrivateSale({ from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        const releasableTge =
            await this.vestingContract.privateSaleReleasable();
        expect(releasableTge.toString()).to.equal(tge);

        await this.vestingContract.releasePrivateSale({ from: admin });
        released = released.add(new BN(releasableTge.toString()));

        const balance = await this.tokenContract.balanceOf(investor1);
        expect(balance.toString(), "balance should not equal 0").to.equal(
            released.toString()
        );

        const monthsCliff = cliff / GAP;
        for (let i = 1; i <= monthsCliff; i++) {
            const releasableCliff =
                await this.vestingContract.privateSaleReleasable();
            expect(releasableCliff.toString()).to.equal("0");
            await time.increase(GAP);
        }

        const months = duration / GAP + 1;
        for (let index = 1; index <= months; index++) {
            const releasable =
                await this.vestingContract.privateSaleReleasable();
            expect(releasable.toString()).to.equal(releasableMonthly);

            await this.vestingContract.releasePrivateSale({ from: admin });
            released = released.add(new BN(releasableMonthly.toString()));
            const balance = await this.tokenContract.balanceOf(investor1);
            expect(
                balance.toString(),
                "balance should not equal released"
            ).to.equal(released.toString());

            await time.increase(GAP);
        }

        const totalBalance = await this.tokenContract.balanceOf(investor1);
        expect(
            totalBalance.toString(),
            "totalBalance should equal total"
        ).to.equal(total.toString());
    });

    it("release public sale by month", async function () {
        const releaseTestVector = config.get("releasePublicSaleByMonth");
        const { total, tge, cliff, duration } = releaseTestVector[0];
        const participant = new BN(Participant.PublicSale);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            new BN(total),
            new BN(tge),
            new BN(cliff),
            new BN(duration),
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activatePublicSale({ from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);

        for (let i = 0; i < releaseTestVector.length; i++) {
            const { elapsedTime, releasable } = releaseTestVector[i];
            await time.increase(elapsedTime);
            const releasableExpect =
                await this.vestingContract.publicSaleReleasable();
            expect(
                releasableExpect.toString(),
                "should equal release expect"
            ).to.equal(releasable);
        }
    });

    it("release advisor by month", async function () {
        const releaseTestVector = config.get("releaseAdvisorByMonth");
        const { total, tge, cliff, duration } = releaseTestVector[0];
        const participant = new BN(Participant.Advisor);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            new BN(total),
            new BN(tge),
            new BN(cliff),
            new BN(duration),
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activateAdvisor({ from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        for (let i = 0; i < releaseTestVector.length; i++) {
            const { elapsedTime, releasable } = releaseTestVector[i];
            await time.increase(GAP);
            const releasableExpect =
                await this.vestingContract.advisorReleasable();
            expect(
                releasableExpect.toString(),
                "should equal release expect"
            ).to.equal(releasable);
        }
    });

    it("release monthly tge != 0", async function () {
        const totalAmount = new BN(TokenOfTeam.Reserve);
        const tge = new BN("1000000");
        const cliff = new BN(TimePhase["3"]);
        const duration = new BN(TimePhase["47"]);
        const participant = new BN(Participant.Reserve);
        await this.vestingContract.addBeneficiary(
            investor1,
            this.genesisTimestamp,
            totalAmount,
            tge,
            cliff,
            duration,
            participant,
            {
                from: admin,
            }
        );
        await this.vestingContract.activate(0, { from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);

        await this.vestingContract.releaseReserve({ from: admin });
        await time.increase(TimePhase["3"]);

        const meanTokenOfMonth = totalAmount.sub(tge).div(new BN("48"));
        for (let i = 1; i <= 48; i++) {
            await this.vestingContract.releaseReserve({ from: admin });
            const balance = await this.tokenContract.balanceOf(investor1);
            expect(balance.toString(), "balance should not equal 0").to.equal(
                meanTokenOfMonth.mul(new BN(i)).add(tge).toString()
            );
            await time.increase(TimePhase["1"]);
        }
        await time.increase(TimePhase["1"]);
        const revertTrx = this.vestingContract.releaseReserve();
        await expectRevert.unspecified(revertTrx);
    });

    it("100 accounts privateSale", async function () {
        for (let index = 1; index <= 10; index++) {
            for (const account of accounts) {
                const totalAmount = new BN(TokenOfTeam.PrivateSale).div(
                    new BN(100)
                );
                const tge = new BN(
                    totalAmount.div(new BN(100)).mul(new BN(10))
                );
                const cliff = new BN(TimePhase["2"]);
                const duration = new BN(TimePhase["17"]);
                const participant = new BN(Participant.PrivateSale);
                await this.vestingContract.addBeneficiary(
                    account,
                    this.genesisTimestamp,
                    totalAmount,
                    tge,
                    cliff,
                    duration,
                    participant,
                    {
                        from: admin,
                    }
                );
            }
        }
        await this.vestingContract.activateAll({ from: admin });
        await time.increase(timeElapsedAfterDeployVestingContract);
        await this.vestingContract.releaseAll({ from: admin });
        await time.increase(TimePhase["1"]);
        for (let i = 1; i <= 18; i++) {
            await time.increase(TimePhase["1"]);
            await this.vestingContract.activateAll({ from: admin });
            await this.vestingContract.releaseAll({ from: admin });
        }
        let totalBalance = new BN("0");
        for (const account of accounts) {
            const balance = await this.tokenContract.balanceOf(account);
            totalBalance = totalBalance.add(new BN(balance.toString()));
        }
        expect(totalBalance.toString()).to.equal(TokenOfTeam.PrivateSale);
    });

    it("multiple team", async function () {
        let i = 0;
        for (let key in TokenOfTeam) {
            const totalAmount = new BN(TokenOfTeam[key]);
            const tge = new BN(
                totalAmount.div(new BN(100)).mul(new BN(TgeOfTeam[key]))
            );
            const cliff = new BN(CliffOfTeam[key]);
            const duration = new BN(DurationOfTeam[key]);
            const participant = new BN(Participant[key]);
            await this.vestingContract.addBeneficiary(
                accounts[i],
                this.genesisTimestamp,
                totalAmount,
                tge,
                cliff,
                duration,
                participant,
                {
                    from: admin,
                }
            );
            i++;
        }
        await time.increase(timeElapsedAfterDeployVestingContract);
        await time.increase(TimePhase["60"]);
        await this.vestingContract.activateAll({ from: admin });
        await this.vestingContract.releaseAll({ from: admin });
        let totalBalance = new BN("0");
        for (const account of accounts) {
            const balance = await this.tokenContract.balanceOf(account);
            totalBalance = totalBalance.add(new BN(balance.toString()));
        }
        expect(totalBalance.toString()).to.equal("100000000");
    });
});
