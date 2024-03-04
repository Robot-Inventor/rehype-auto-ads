import { visitParents } from "unist-util-visit-parents";
import type { Plugin, Transformer } from "unified";
import type { Node } from "unist";
import type { Root } from "mdast";

/**
 * Options for the remark-auto-ads plugin.
 */
export interface RemarkAutoAdsOptions {
    /**
     * The ad code to be inserted. For example, Google Adsense display ad code.
     */
    adCode: string;
    /**
     * Initial value of paragraph counter. In other words, this value should be set to the value of ``paragraphInterval`` minus the number of paragraphs you want to insert the first ad.
     *
     * If you want to insert ad code from the third paragraph and every 5 paragraphs, set this to ``2``.
     *
     * @default 0
     */
    countFrom?: number;
    /**
     * The value indicating how many paragraphs to insert advertising code. For example, specifying 5 will insert ads every 5 paragraphs.
     *
     * @default 5
     */
    paragraphInterval?: number;
}

/**
 * Complete option data merged with default and user-specified options.
 */
type RemarkAutoAdsFullOptions = Required<RemarkAutoAdsOptions>;

declare module "unist" {
    interface Data {
        hName?: string;
    }

    interface Node {
        children?: Node[];
    }
}

/**
 * remark.js plugin that automatically inserts Google Adsense (and theoretically any ad service) code.
 *
 * This plugin inserts an ad code for each specified number of paragraphs. For example, insert Google Adsense display ad code every 5 paragraphs.
 */
const remarkAutoAds: Plugin<RemarkAutoAdsOptions[], Root> = (args: RemarkAutoAdsOptions) => {
    const defaultOptions = {
        countFrom: 0,
        paragraphInterval: 5
    };

    const options: RemarkAutoAdsFullOptions = {
        ...defaultOptions,
        ...args
    };

    const transform: Transformer<Root> = (tree) => {
        let paragraphCount = options.countFrom || 0;

        visitParents<Node, string>(tree, "paragraph", (node, ancestors: Node[]) => {
            if (node.type === "paragraph") {
                paragraphCount++;
            }

            const skipNode = ancestors.some((ancestor) => {
                return ["blockquote", "list"].includes(ancestor.type) || ancestor.data?.hName === "aside";
            });

            if (skipNode) return;

            if (paragraphCount >= options.paragraphInterval) {
                paragraphCount = 0;

                const adNode = {
                    type: "html",
                    value: options.adCode
                };

                if (ancestors.length === 0) return;

                const parent = ancestors[ancestors.length - 1];
                if (!parent.children) return;
                const index = parent.children.indexOf(node);

                if (index >= 0) {
                    parent.children.splice(index + 1, 0, adNode);
                }
            }
        });
    };

    return transform;
};

export default remarkAutoAds;
