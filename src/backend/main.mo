import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import List "mo:core/List";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Error "mo:core/Error";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Float "mo:core/Float";
import Timer "mo:core/Timer";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Include blob storage
  include MixinStorage();

  // Include authorization system (with role-based access control)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types

  public type UserProfile = {
    name : Text;
    email : ?Text;
    timezone : ?Text;
  };

  type CurrencyPair = {
    base : Text;
    quote : Text;
    forex : Bool;
  };

  type Trade = {
    id : Nat;
    pair : CurrencyPair;
    direction : Text; // "buy" or "sell"
    entryPrice : Float;
    exitPrice : Float;
    lotSize : Float;
    pips : Float;
    pnl : Float;
    notes : Text;
    date : Time.Time;
    riskAmount : Float;
    rewardAmount : Float;
    fileAttachment : ?Storage.ExternalBlob;
  };

  type TradeStats = {
    totalTrades : Nat;
    wins : Nat;
    losses : Nat;
    totalPips : Float;
    totalPnl : Float;
    winRate : Float;
    bestTrade : ?Trade;
    worstTrade : ?Trade;
    averageRiskReward : Float;
  };

  type DailyLimit = {
    lossLimit : Float;
    profitTarget : Float;
    isActive : Bool;
    date : Time.Time;
  };

  type ChecklistItem = {
    id : Nat;
    title : Text;
    isChecked : Bool;
  };

  // State

  let userProfiles = Map.empty<Principal, UserProfile>();
  let trades = Map.empty<Principal, List.List<Trade>>();
  let dailyLimits = Map.empty<Principal, DailyLimit>();
  let checklists = Map.empty<Principal, List.List<ChecklistItem>>();

  // Constants
  let pointsPerPip = 4_000_000_000;
  let dailyReset = 24 * 60 * 60 * 1_000_000_000; // in nanoseconds

  // Currency pairs (static)
  let currencyPairs : [CurrencyPair] = [
    { base = "USD"; quote = "EUR"; forex = true },
    { base = "USD"; quote = "JPY"; forex = true },
    { base = "BTC"; quote = "USD"; forex = false },
    { base = "ETH"; quote = "USD"; forex = false },
    { base = "EUR"; quote = "JPY"; forex = true },
    // Add more as needed
  ];

  // User Profile Functions (Required by frontend)

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Daily Limit Functions

  public query ({ caller }) func hasDailyLimit() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check daily limits");
    };
    dailyLimits.containsKey(caller);
  };

  public shared ({ caller }) func setDailyLimit(limit : DailyLimit) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set daily limits");
    };
    if (limit.lossLimit < 0) {
      Runtime.trap("Account balance never negative.");
    };
    dailyLimits.add(caller, limit);
  };

  public query ({ caller }) func getDailyLimit() : async ?DailyLimit {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view daily limits");
    };
    dailyLimits.get(caller);
  };

  // Trade Functions

  public shared ({ caller }) func addTrade(trade : Trade) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add trades");
    };
    let currentTrades = switch (trades.get(caller)) {
      case (null) { List.empty<Trade>() };
      case (?tradesList) { tradesList };
    };
    currentTrades.add(trade);
    trades.add(caller, currentTrades);
  };

  public query ({ caller }) func getAllTrades() : async [Trade] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };
    let currentTrades = switch (trades.get(caller)) {
      case (null) { List.empty<Trade>() };
      case (?tradesList) { tradesList };
    };
    currentTrades.toArray();
  };

  // Checklist Functions

  public shared ({ caller }) func addChecklistItem(item : ChecklistItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add checklist items");
    };
    let currentChecklist = switch (checklists.get(caller)) {
      case (null) { List.empty<ChecklistItem>() };
      case (?list) { list };
    };
    currentChecklist.add(item);
    checklists.add(caller, currentChecklist);
  };

  public query ({ caller }) func getChecklist() : async [ChecklistItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view checklist");
    };
    let currentChecklist = switch (checklists.get(caller)) {
      case (null) { List.empty<ChecklistItem>() };
      case (?list) { list };
    };
    currentChecklist.toArray();
  };

  public shared ({ caller }) func resetAllChecks() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reset checklist");
    };
    let currentChecklist = switch (checklists.get(caller)) {
      case (null) { List.empty<ChecklistItem>() };
      case (?list) { list };
    };
    let resetChecklist = currentChecklist.map<ChecklistItem, ChecklistItem>(
      func(item) {
        { item with isChecked = false };
      }
    );
    checklists.add(caller, resetChecklist);
  };

  // Currency Pairs (Public reference data - no auth required)

  public query func getCurrencyPairs() : async [CurrencyPair] {
    currencyPairs;
  };

  // Calculate pips for a trade (utility function - requires user role)

  public query ({ caller }) func calculatePips(pair : CurrencyPair, entryPrice : Float, exitPrice : Float, lotSize : Float) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can calculate pips");
    };
    let pipValue : Float = if (pair.quote == "JPY") { 0.01 } else { 0.0001 };
    let pips : Float = ((exitPrice - entryPrice) / pipValue) * lotSize;
    pips;
  };

  // Win rate and risk reward calculation (utility function - requires user role)

  public query ({ caller }) func calculateWinRateAndRiskReward(tradesArray : [Trade]) : async { winRate : Float; averageRiskReward : Float } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can calculate statistics");
    };
    if (tradesArray.size() == 0) {
      return { winRate = 0; averageRiskReward = 0 };
    };

    var wins = 0;
    var totalRisk = 0.0;
    var totalReward = 0.0;

    for (trade in tradesArray.values()) {
      if (trade.pnl > 0) { wins += 1 };
      totalRisk += trade.riskAmount;
      totalReward += trade.rewardAmount;
    };

    let winRate = if (tradesArray.size() > 0) { (wins.toFloat() / tradesArray.size().toInt().toFloat()) * 100.0 } else {
      0.0;
    };
    let averageRiskReward = if (totalRisk > 0) { totalReward / totalRisk } else {
      0.0;
    };

    {
      winRate;
      averageRiskReward;
    };
  };

  module Trade {
    public func compareByPnl(trade1 : Trade, trade2 : Trade) : Order.Order {
      Float.compare(trade1.pnl, trade2.pnl);
    };
  };

  // Find best and worst trades (utility function - requires user role)

  public query ({ caller }) func findBestAndWorstTrades(tradesArray : [Trade]) : async { bestTrade : ?Trade; worstTrade : ?Trade } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trade statistics");
    };
    if (tradesArray.isEmpty()) {
      return { bestTrade = null; worstTrade = null };
    };

    let sortedTrades = tradesArray.sort(Trade.compareByPnl);
    let bestTrade = ?sortedTrades.get(0);
    let worstTrade = ?sortedTrades.get(tradesArray.size() - 1);
    { bestTrade; worstTrade };
  };
};
