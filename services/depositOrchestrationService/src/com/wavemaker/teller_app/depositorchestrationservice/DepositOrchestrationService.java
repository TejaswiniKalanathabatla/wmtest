/*Copyright (c) 2022-2023 wavemaker.com All Rights Reserved.This software is the confidential and proprietary information of wavemaker.com You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the source code license agreement you entered into with wavemaker.com*/
package com.wavemaker.teller_app.depositorchestrationservice;

import java.sql.Date;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

import com.wavemaker.runtime.service.annotations.ExposeToClient;

import com.wavemaker.teller_app.teller_db.Balance;
import com.wavemaker.teller_app.teller_db.DepositAccount;
import com.wavemaker.teller_app.teller_db.TransactionHistory;
import com.wavemaker.teller_app.teller_db.service.BalanceService;
import com.wavemaker.teller_app.teller_db.service.DepositAccountService;
import com.wavemaker.teller_app.teller_db.service.TransactionHistoryService;

import com.wavemaker.teller_app.depositorchestrationservice.model.DepositResponse;

/**
 * This is a singleton class with all its public methods exposed as REST APIs via generated controller class.
 * To avoid exposing an API for a particular public method, annotate it with @HideFromClient.
 *
 * Method names will play a major role in defining the Http Method for the generated APIs. For example, a method name
 * that starts with delete/remove, will make the API exposed as Http Method "DELETE".
 *
 * Method Parameters of type primitives (including java.lang.String) will be exposed as Query Parameters &
 * Complex Types/Objects will become part of the Request body in the generated API.
 *
 * NOTE: We do not recommend using method overloading on client exposed methods.
 */
@ExposeToClient
public class DepositOrchestrationService {

    private static final Logger logger = LoggerFactory.getLogger(DepositOrchestrationService.class);

    @Autowired
    @Qualifier("teller_db.DepositAccountService")
    private DepositAccountService depositAccountService;

    @Autowired
    @Qualifier("teller_db.TransactionHistoryService")
    private TransactionHistoryService transactionHistoryService;

    @Autowired
    @Qualifier("teller_db.BalanceService")
    private BalanceService balanceService;

    /**
     * Orchestrates the creation of a term deposit by:
     * 1. Creating a deposit account record
     * 2. Logging the transaction in transaction history
     * 3. Updating the account balance
     *
     * @param accountId       The account ID (FK for deposit_account.account_number)
     * @param termDeposit     The deposit principal amount
     * @param rateOfInterest  The interest rate
     * @param maturityAmount  The pre-calculated maturity value
     * @param depositedAt     The deposit start date (milliseconds since epoch)
     * @param maturedAt       The maturity date (milliseconds since epoch)
     * @param depositStatus   The deposit status (e.g. "ACTIVE")
     * @param currentBalance  The current balance before deduction
     * @param balanceId       The balance record's ID (needed for the PUT update)
     * @return DepositResponse containing success flag and the created deposit ID
     */
    public DepositResponse createDeposit(
            Integer accountId,
            Double termDeposit,
            Double rateOfInterest,
            Double maturityAmount,
            Long depositedAt,
            Long maturedAt,
            String depositStatus,
            Double currentBalance,
            Integer balanceId) {

        logger.debug("Starting createDeposit orchestration for accountId: {}", accountId);

        // Step 1: Create the deposit account record
        DepositAccount depositAccount = new DepositAccount();
        depositAccount.setAccountNumber(accountId);
        depositAccount.setTermDeposit(termDeposit);
        depositAccount.setRateOfInterest(rateOfInterest);
        depositAccount.setMaturityAmount(maturityAmount);
        depositAccount.setDepositedAt(depositedAt != null ? new Date(depositedAt) : null);
        depositAccount.setMaturedAt(maturedAt != null ? new Date(maturedAt) : null);
        depositAccount.setStatus(depositStatus);

        DepositAccount createdDeposit = depositAccountService.create(depositAccount);
        logger.debug("Created deposit account with id: {}", createdDeposit.getId());

        // Step 2: Calculate new balance
        double newBalance = currentBalance - termDeposit;
        logger.debug("Calculated new balance: {} (currentBalance: {} - termDeposit: {})", newBalance, currentBalance, termDeposit);

        // Step 3: Log the transaction in transaction history
        TransactionHistory transactionHistory = new TransactionHistory();
        transactionHistory.setAccountNumber(accountId);
        transactionHistory.setTransactionType("DEPOSIT");
        transactionHistory.setAmount(termDeposit);
        transactionHistory.setTotalAmount(newBalance);
        transactionHistory.setStatus("COMPLETED");
        transactionHistory.setTransactedAt(LocalDateTime.now());

        transactionHistoryService.create(transactionHistory);
        logger.debug("Logged transaction history for accountId: {}", accountId);

        // Step 4: Update the balance record
        Balance balance = balanceService.getById(balanceId);
        balance.setCurrentBalance(newBalance);
        balanceService.update(balance);
        logger.debug("Updated balance for balanceId: {} to newBalance: {}", balanceId, newBalance);

        // Step 5: Return success response
        DepositResponse response = new DepositResponse();
        response.setSuccess(true);
        response.setDepositId(createdDeposit.getId());
        response.setMessage("Deposit created successfully");
        response.setNewBalance(newBalance);

        logger.debug("createDeposit orchestration completed successfully for depositId: {}", createdDeposit.getId());
        return response;
    }
}
