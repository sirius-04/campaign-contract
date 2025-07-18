// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Campaign {
  struct Request {
    string description;
    uint256 value;
    address recipient;
    bool complete;
    mapping(address => bool) approvals;
    uint approvalCount;
  }

  Request[] public requests;
  address public manager;
  uint256 public minimumContribution;
  mapping(address => bool) public approvers;
  uint public approversCount;
  uint public requiredApprovalPercentage = 60;

  modifier restricted() {
    require(msg.sender == manager);
    _;
  }

  constructor(uint256 minimum, address creator) {
    manager = creator;
    minimumContribution = minimum;
  }

  function contribute() public payable {
    require(msg.value >= minimumContribution);

    if (!approvers[msg.sender]) {
        approvers[msg.sender] = true;
        approversCount++;
    }
  }

  function createRequest(string memory description, uint256 value, address recipient) 
    public restricted {
        Request storage newRequest = requests.push();

        newRequest.description = description;
        newRequest.value = value;
        newRequest.recipient = recipient;
        newRequest.complete = false;
        newRequest.approvalCount = 0;
  }

  function approveRequest(uint index) public{
    Request storage request = requests[index];

    require(approvers[msg.sender] && !request.approvals[msg.sender]);

    request.approvals[msg.sender] = true;
    request.approvalCount++;
  }

  function finalizeRequest(uint index) public restricted {
    Request storage request = requests[index];

    require(!request.complete && (request.approvalCount * 100 / approversCount >= requiredApprovalPercentage));

    payable(request.recipient).transfer(request.value);
    request.complete = true;
  }
}

contract CampaignFactory {
  address[] public deployedCampaigns;

  event CampaignCreated(address campaignAddress, address creator);

  function createCampaign(uint256 minimum) public {
    Campaign newCampaign = new Campaign(minimum, msg.sender);
    
    deployedCampaigns.push(address(newCampaign));
    
    emit CampaignCreated(address(newCampaign), msg.sender);
  }

  function getDeployedCampaigns() public view returns (address[] memory) {
    return deployedCampaigns;
  }
}
