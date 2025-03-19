import { DependencyContainer } from "tsyringe";

// SPT types
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ImageRouter } from "@spt/routers/ImageRouter";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { IInsuranceConfig } from "@spt/models/spt/config/IInsuranceConfig";
import { ITraderConfig } from "@spt/models/spt/config/ITraderConfig";
import { IRagfairConfig } from "@spt/models/spt/config/IRagfairConfig";
import { JsonUtil } from "@spt/utils/JsonUtil";
import { Traders } from "@spt/models/enums/Traders";


// New trader settings
import baseJson = require("../db/base.json");
import assortJson = require("../db/assort.json");
import dialogueJson = require("../db/dialogue.json")

import { TraderHelper } from "./utils/TraderHelper";
import { PrefixLogger } from "./utils/PrefixLogger";
import { BaseClasses } from "@spt/models/enums/BaseClasses";
import { ObjectFlags } from "typescript";

class ScavCat implements IPreSptLoadMod, IPostDBLoadMod
{
    private mod: string;
    private traderImgPath: string;
    private logger: PrefixLogger;
    private traderHelper: TraderHelper;


    constructor() {
        this.mod = "tetrisdevdonutxlord-scavcat";
        this.traderImgPath = "res/SCAVCAT.jpg"; // Set path to trader image
    }

    /**
     * Some work needs to be done prior to SPT code being loaded, registering the profile image + setting trader update time inside the trader config json
     * @param container Dependency container
     */
    public preSptLoad(container: DependencyContainer): void
    {
        // Get a logger
        this.logger = PrefixLogger.getInstance(container);
        this.logger.debug('preSpt Loading... ');

        // Get SPT code/data we need later
        const preSptModLoader: PreSptModLoader = container.resolve<PreSptModLoader>("PreSptModLoader");
        const imageRouter: ImageRouter = container.resolve<ImageRouter>("ImageRouter");
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const traderConfig: ITraderConfig = configServer.getConfig<ITraderConfig>(ConfigTypes.TRADER);
        const ragfairConfig = configServer.getConfig<IRagfairConfig>(ConfigTypes.RAGFAIR);

        // Create helper class and use it to register our traders image/icon + set its stock refresh time
        this.traderHelper = new TraderHelper();
        imageRouter.addRoute(baseJson.avatar.replace(".jpg", ""), `${preSptModLoader.getModPath(this.mod)}${this.traderImgPath}`);
        this.traderHelper.setTraderUpdateTime(traderConfig, baseJson, 3600, 4000);

        // Add trader to trader enum
        Traders[baseJson._id] = baseJson._id;

        // Add trader to flea market
        ragfairConfig.traders[baseJson._id] = true;

        this.logger.debug('preSpt Loaded');
    }

    /**
     * Majority of trader-related work occurs after the spt database has been loaded but prior to SPT code being run
     * @param container Dependency container
     */
    public postDBLoad(container: DependencyContainer): void
    {
        this.logger.debug('postDb Loading... ');

        // Resolve SPT classes we'll use
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const configServer: ConfigServer = container.resolve<ConfigServer>("ConfigServer")
        const jsonUtil: JsonUtil = container.resolve<JsonUtil>("JsonUtil");

        // Get a reference to the database tables
        const tables = databaseServer.getTables();
        const insuranceConfig = configServer.getConfig<IInsuranceConfig>(ConfigTypes.INSURANCE);

        // Add Trader to database
        this.traderHelper.addTraderToDb(baseJson, tables, jsonUtil, assortJson, dialogueJson);

        // Add Trader to Locales
        this.traderHelper.addTraderToLocales(baseJson, tables, baseJson.surname, baseJson.name, baseJson.nickname, baseJson.location, baseJson.description);
        
        //Scav Cat Insurance return chance 100%
        insuranceConfig.returnChancePercent["67dae9c254023e4f20bac54f"] = 100;

        this.logger.debug('postDb Loaded');
    }
}

export const mod = new ScavCat();
