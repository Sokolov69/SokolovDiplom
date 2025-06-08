import { type ExpoConfig } from "@expo/config-types";
import { withAppDelegate, type ConfigPlugin } from "expo/config-plugins";

const config: ExpoConfig = {
    name: "trade_app",
    slug: "trade-app",
    version: "1.0.0",
    extra: {
        mapKitApiKey: "bef0b6db-3d2c-4f46-81ef-923e9d4fa5f6",
    },
    android: {
        package: "com.ivan.sokolov.tradeapp"
    },
};

const withYandexMaps: ConfigPlugin = (config) => {
    return withAppDelegate(config, async (config) => {
        const appDelegate = config.modResults;

        // Add import
        if (!appDelegate.contents.includes("#import <YandexMapsMobile/YMKMapKitFactory.h>")) {
            // Replace the first line with the intercom import
            appDelegate.contents = appDelegate.contents.replace(
                /#import "AppDelegate.h"/g,
                `#import "AppDelegate.h"\n#import <YandexMapsMobile/YMKMapKitFactory.h>`
            );
        }

        const mapKitMethodInvocations = [
            `[YMKMapKit setApiKey:@"${config.extra?.mapKitApiKey}"];`,
            `[YMKMapKit setLocale:@"ru_RU"];`,
            `[YMKMapKit mapKit];`,
        ]
            .map((line) => `\t${line}`)
            .join("\n");

        // Add invocation
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (!appDelegate.contents.includes(mapKitMethodInvocations)) {
            appDelegate.contents = appDelegate.contents.replace(
                /\s+return YES;/g,
                `\n\n${mapKitMethodInvocations}\n\n\treturn YES;`
            );
        }

        return config;
    });
};

export default withYandexMaps(config);