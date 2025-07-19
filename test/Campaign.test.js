const { assert, expect } = require("chai");

describe("Campaign", () => {
  let accounts;
  let campaign;
  let campaignAddress;
  let campaignFactory;

  beforeEach(async () => {
    accounts = await ethers.getSigners();

    // get the contract factory
    const CampaignFactory = await ethers.getContractFactory('CampaignFactory');
    const Campaign = await ethers.getContractFactory('Campaign');

    // deploy the campaignFactory
    campaignFactory = await CampaignFactory.deploy();

    // create a campaign instance in local blockchain
    await campaignFactory.createCampaign('100');

    // get the instance address
    [campaignAddress] = await campaignFactory.getDeployedCampaigns();

    // get the instance
    campaign = new ethers.Contract(campaignAddress, Campaign.interface, accounts[0]);
  });

  it('deploys campaign & factory', () => {
    assert.typeOf(campaign.target, 'string');
    assert.typeOf(campaignFactory.target, 'string');
  });

  it('mark createCampaign caller as manager', async () => {
    const manager = await campaign.manager();

    assert.equal(manager, accounts[0].address);
  });

  it('mark user approver after contribute', async () => {
    await campaign.connect(accounts[1]).contribute({ value: 100 });

    const isApprover = await campaign.approvers(accounts[1].address);

    assert.equal(isApprover, true);
  });

  it('require minimum contribution', async () => {
    await expect(
      campaign.connect(accounts[2]).contribute({ value: 99 })
    ).to.be.reverted;
  });

  it('manager can create payment request', async () => {
    const description = 'test request description 1';

    await campaign.connect(accounts[0]).createRequest(
      description,
      '100000',
      accounts[2].address
    );

    const request = await campaign.requests(0);

    assert.equal(request.description, description);
  });

  it('processes requests', async () => {
    await campaign.connect(accounts[0]).contribute({ value: ethers.parseEther('10') });

    await campaign.createRequest(
      'test request description 2',
      ethers.parseEther('5'),
      accounts[3].address
    );

    await campaign.approveRequest(0);

    await campaign.finalizeRequest(0);

    let balance = await ethers.provider.getBalance(accounts[3].address);
    balance = ethers.parseEther(balance.toString());
    balance = parseFloat(balance);

    assert(balance > 104);
    
  });
});
