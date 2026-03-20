// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AgentEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public jobCounter;
    
    address public owner;
    address public serverAdmin;

    uint256 public constant TIMEOUT = 1 days;

    enum JobStatus { PENDING, COMPLETED, REFUNDED }

    struct Job {
        address client;
        address agent;
        address usdt;
        uint256 amount;
        uint256 createdAt;
        JobStatus status;
    }

    mapping(uint256 => Job) public jobs;

    event JobCreated(uint256 jobId, address client, address agent, uint256 amount);
    event JobCompleted(uint256 jobId);
    event JobRefunded(uint256 jobId);

    constructor() {
        owner = msg.sender; 
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyServer() {
        require(msg.sender == serverAdmin, "Only server");
        _;
    }

    function setServerAdmin(address _adminAddress) external onlyOwner {
        require(_adminAddress != address(0), "Invalid address");
        serverAdmin = _adminAddress;
    }

    function createJob(
        address agent,
        address usdt,
        uint256 amount
    ) external nonReentrant returns (uint256 jobId) {
        require(agent != address(0), "Invalid agent");
        require(usdt != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");

        jobId = ++jobCounter;

        jobs[jobId] = Job({
            client: msg.sender,
            agent: agent,
            usdt: usdt,
            amount: amount,
            createdAt: block.timestamp,
            status: JobStatus.PENDING
        });

        IERC20(usdt).safeTransferFrom(msg.sender, address(this), amount);

        emit JobCreated(jobId, msg.sender, agent, amount);
    }

    function completeJob(uint256 jobId) external onlyServer nonReentrant {
        Job storage job = jobs[jobId];

        require(job.client != address(0), "Job does not exist");
        require(job.status == JobStatus.PENDING, "Not pending");

        job.status = JobStatus.COMPLETED;

        IERC20(job.usdt).safeTransfer(job.agent, job.amount);

        emit JobCompleted(jobId);
    }

    function refundJob(uint256 jobId) external onlyServer nonReentrant {
        Job storage job = jobs[jobId];

        require(job.client != address(0), "Job does not exist");
        require(job.status == JobStatus.PENDING, "Not pending");

        job.status = JobStatus.REFUNDED;

        IERC20(job.usdt).safeTransfer(job.client, job.amount);

        emit JobRefunded(jobId);
    }

    // 🔥 Emergency escape (very important)
    function forceRefund(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];

        require(job.client != address(0), "Job does not exist");
        require(job.status == JobStatus.PENDING, "Not pending");
        require(block.timestamp > job.createdAt + TIMEOUT, "Too early");

        job.status = JobStatus.REFUNDED;

        IERC20(job.usdt).safeTransfer(job.client, job.amount);

        emit JobRefunded(jobId);
    }
}