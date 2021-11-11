const {
    BN,
    constants,
    expectEvent,
    expectRevert,
} = require("@openzeppelin/test-helpers");
const { accounts, contract } = require("@openzeppelin/test-environment");
const DragonKart = contract.fromArtifact("DragonKart");
const { expect } = require("chai");
const [owner, recipient1, recipient2, spender] = accounts;
const tokenName = "Gold";
const tokenSymbol = "GLD";

describe("ERC20Token", async function () {
    beforeEach(async function () {
        this.erc20Token = await DragonKart.new(tokenName, tokenSymbol, {
            from: owner,
        });
    });

    it("decimals()", async function () {
        expect((await this.erc20Token.decimals()).toString()).to.equal("18");
    });

    it("totalSupply()", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        expect((await this.erc20Token.totalSupply()).toString()).to.equal(
            "100000000000000000000000000"
        );
    });

    it("balanceOf()", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        expect((await this.erc20Token.balanceOf(owner)).toString()).to.equal(
            "100000000000000000000000000"
        );
    });

    it("cap()", async function () {
        expect((await this.erc20Token.cap()).toString()).to.equal(
            "100000000000000000000000000"
        );
    });

    it("mint()", async function () {
        const receipt = await this.erc20Token.mint(
            recipient1,
            "10000000000000000000000000",
            {
                from: owner,
            }
        );
        expect(
            (await this.erc20Token.balanceOf(recipient1)).toString()
        ).to.equal("10000000000000000000000000");

        expectEvent(receipt, "Transfer", {
            from: constants.ZERO_ADDRESS,
            to: recipient1,
            value: "10000000000000000000000000",
        });
    });

    it("mint(): caller is not the owner", async function () {
        const revertTrx = this.erc20Token.mint(
            recipient1,
            "10000000000000000000000000",
            {
                from: spender,
            }
        );
        await expectRevert.unspecified(revertTrx);
    });

    it("mint(): Amount exceeds capped", async function () {
        await expectRevert.unspecified(
            this.erc20Token.mint(recipient1, "100000000000000000000000001", {
                from: owner,
            })
        );
    });

    it("pause", async function () {
        await this.erc20Token.mint(owner, "1000000000000", {
            from: owner,
        });
        await this.erc20Token.pause({ from: owner });
        await expectRevert(
            this.erc20Token.transfer(recipient1, new BN("1000000000000"), {
                from: owner,
            }),
            "ERC20Pausable: token transfer while paused"
        );

        await expectRevert.unspecified(
            this.erc20Token.mint(owner, "1000000000000", {
                from: owner,
            })
        );
    });

    it("unpause", async function () {
        await this.erc20Token.mint(owner, "1000000000000", {
            from: owner,
        });
        await this.erc20Token.pause({ from: owner });
        await expectRevert(
            this.erc20Token.transfer(recipient1, new BN("1000000000000"), {
                from: owner,
            }),
            "ERC20Pausable: token transfer while paused"
        );
        await this.erc20Token.unpause({ from: owner });
        await this.erc20Token.transfer(recipient1, new BN("1000000000000"), {
            from: owner,
        });

        expect((await this.erc20Token.balanceOf(owner)).toString()).to.equal(
            "0"
        );
        expect(
            (await this.erc20Token.balanceOf(recipient1)).toString()
        ).to.equal("1000000000000");

        await this.erc20Token.mint(owner, "1000000000000", {
            from: owner,
        });

        expect((await this.erc20Token.balanceOf(owner)).toString()).to.equal(
            "1000000000000"
        );
    });

    it("transfer(): Transfer to zero address", async function () {
        await expectRevert.unspecified(
            this.erc20Token.transfer(
                constants.ZERO_ADDRESS,
                new BN("1000000000000"),
                {
                    from: owner,
                }
            )
        );
    });

    it("transfer(): Transfer amount of tokens greater than current balance", async function () {
        await expectRevert.unspecified(
            this.erc20Token.transfer(
                recipient1,
                new BN("100000000000000000000000001"),
                {
                    from: owner,
                }
            )
        );
    });

    it("transfer(): Transfer all of current balance", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        const receipt = await this.erc20Token.transfer(
            recipient1,
            new BN("100000000000000000000000000"),
            {
                from: owner,
            }
        );

        expect((await this.erc20Token.balanceOf(owner)).toString()).to.equal(
            "0"
        );

        expect(
            (await this.erc20Token.balanceOf(recipient1)).toString()
        ).to.equal("100000000000000000000000000");

        expectEvent(receipt, "Transfer", {
            from: owner,
            to: recipient1,
            value: "100000000000000000000000000",
        });
    });

    it("transfer(): Transfer amount less than current balance", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        const receipt = await this.erc20Token.transfer(
            recipient1,
            new BN("99999999999999999999999999"),
            {
                from: owner,
            }
        );

        expect((await this.erc20Token.balanceOf(owner)).toString()).to.equal(
            "1"
        );

        expect(
            (await this.erc20Token.balanceOf(recipient1)).toString()
        ).to.equal("99999999999999999999999999");

        expectEvent(receipt, "Transfer", {
            from: owner,
            to: recipient1,
            value: "99999999999999999999999999",
        });
    });

    it("approve(): Approve for zero address", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        await this.erc20Token.transfer(recipient1, new BN("20000000000000"), {
            from: owner,
        });
        await expectRevert.unspecified(
            this.erc20Token.approve(
                constants.ZERO_ADDRESS,
                new BN("20000000000000"),
                {
                    from: recipient1,
                }
            )
        );
    });

    it("approve(): Emit Approval event", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        await this.erc20Token.transfer(recipient1, new BN("20000000000000"), {
            from: owner,
        });
        const receipt = await this.erc20Token.approve(
            spender,
            new BN("20000000000000"),
            {
                from: recipient1,
            }
        );

        expectEvent(receipt, "Approval", {
            owner: recipient1,
            spender,
            value: "20000000000000",
        });
    });

    it("allowance()", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        await this.erc20Token.transfer(recipient1, new BN("20000000000000"), {
            from: owner,
        });
        await this.erc20Token.approve(spender, new BN("20000000000000"), {
            from: recipient1,
        });

        expect(
            (await this.erc20Token.allowance(recipient1, spender)).toString()
        ).to.equal("20000000000000");
    });

    it("transferFrom()", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        await this.erc20Token.transfer(recipient1, new BN("20000000000000"), {
            from: owner,
        });
        await this.erc20Token.approve(spender, new BN("20000000000000"), {
            from: recipient1,
        });
        const receipt = await this.erc20Token.transferFrom(
            recipient1,
            recipient2,
            new BN("20000000000000"),
            {
                from: spender,
            }
        );

        expect(
            (await this.erc20Token.balanceOf(recipient1)).toString()
        ).to.equal("0");

        expect(
            (await this.erc20Token.balanceOf(recipient2)).toString()
        ).to.equal("20000000000000");

        expectEvent(receipt, "Transfer", {
            from: recipient1,
            to: recipient2,
            value: "20000000000000",
        });

        expectEvent(receipt, "Approval", {
            owner: recipient1,
            spender,
            value: "0",
        });
    });

    it("transferFrom(): Transfer amount greater than approved amount", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        await this.erc20Token.transfer(recipient1, new BN("20000000000000"), {
            from: owner,
        });
        await this.erc20Token.approve(spender, new BN("20000000000000"), {
            from: recipient1,
        });
        await expectRevert.unspecified(
            this.erc20Token.transferFrom(
                recipient1,
                recipient2,
                new BN("20000000000001"),
                {
                    from: spender,
                }
            )
        );
    });

    it("increaseAllowance()", async function () {
        const receipt = await this.erc20Token.increaseAllowance(
            spender,
            new BN("20000000000000"),
            {
                from: recipient1,
            }
        );

        expect(
            (await this.erc20Token.allowance(recipient1, spender)).toString()
        ).to.equal("20000000000000");

        expectEvent(receipt, "Approval", {
            owner: recipient1,
            spender,
            value: "20000000000000",
        });
    });

    it("decreaseAllowance()", async function () {
        await this.erc20Token.increaseAllowance(
            spender,
            new BN("20000000000000"),
            {
                from: recipient1,
            }
        );

        const receipt = await this.erc20Token.decreaseAllowance(
            spender,
            new BN("15000000000000"),
            {
                from: recipient1,
            }
        );

        expect(
            (await this.erc20Token.allowance(recipient1, spender)).toString()
        ).to.equal("5000000000000");

        expectEvent(receipt, "Approval", {
            owner: recipient1,
            spender,
            value: "5000000000000",
        });
    });

    it("decreaseAllowance(): Decrease allowance below zero", async function () {
        await this.erc20Token.increaseAllowance(
            spender,
            new BN("20000000000000"),
            {
                from: recipient1,
            }
        );

        await expectRevert.unspecified(
            this.erc20Token.decreaseAllowance(
                spender,
                new BN("20000000000001"),
                {
                    from: recipient1,
                }
            )
        );
    });

    it("burn(): Burn amount exceeds balance", async function () {
        await expectRevert.unspecified(
            this.erc20Token.burn(new BN("100000000000000000000000001"), {
                from: owner,
            })
        );
    });

    it("burn(): Burn all current balance", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        const receipt = await this.erc20Token.burn(
            new BN("100000000000000000000000000"),
            {
                from: owner,
            }
        );

        expect((await this.erc20Token.balanceOf(owner)).toString()).to.equal(
            "0"
        );

        expectEvent(receipt, "Transfer", {
            from: owner,
            to: constants.ZERO_ADDRESS,
            value: "100000000000000000000000000",
        });
    });

    it("burnFrom(): Burn all approved amount", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        await this.erc20Token.transfer(recipient1, new BN("20000000000000"), {
            from: owner,
        });
        await this.erc20Token.approve(spender, new BN("20000000000000"), {
            from: recipient1,
        });

        const receipt = await this.erc20Token.burnFrom(
            recipient1,
            new BN("20000000000000"),
            {
                from: spender,
            }
        );

        expect(
            (await this.erc20Token.balanceOf(recipient1)).toString()
        ).to.equal("0");

        expectEvent(receipt, "Transfer", {
            from: recipient1,
            to: constants.ZERO_ADDRESS,
            value: "20000000000000",
        });

        expect(
            (await this.erc20Token.allowance(recipient1, spender)).toString()
        ).to.equal("0");
    });

    it("burnFrom(): Burn amount less than approved amount", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        await this.erc20Token.transfer(recipient1, new BN("20000000000000"), {
            from: owner,
        });
        await this.erc20Token.approve(spender, new BN("20000000000000"), {
            from: recipient1,
        });

        const receipt = await this.erc20Token.burnFrom(
            recipient1,
            new BN("11000000000000"),
            {
                from: spender,
            }
        );

        expect(
            (await this.erc20Token.balanceOf(recipient1)).toString()
        ).to.equal("9000000000000");

        expectEvent(receipt, "Transfer", {
            from: recipient1,
            to: constants.ZERO_ADDRESS,
            value: "11000000000000",
        });

        expect(
            (await this.erc20Token.allowance(recipient1, spender)).toString()
        ).to.equal("9000000000000");
    });

    it("burnFrom(): Burn amount exceeds approved amount", async function () {
        await this.erc20Token.mint(owner, "100000000000000000000000000", {
            from: owner,
        });
        await this.erc20Token.transfer(recipient1, new BN("20000000000000"), {
            from: owner,
        });
        await this.erc20Token.approve(spender, new BN("20000000000000"), {
            from: recipient1,
        });

        await expectRevert.unspecified(
            this.erc20Token.burnFrom(recipient1, new BN("20000000000001"), {
                from: spender,
            })
        );
    });
});
