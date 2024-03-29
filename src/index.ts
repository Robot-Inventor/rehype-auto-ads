import { visitParents } from "unist-util-visit-parents";
import type { Plugin, Transformer } from "unified";
import type { ElementContent, Root } from "hast";
import { isElement } from "hast-util-is-element";
import { fromHtml } from "hast-util-from-html";

/**
 * Options for the rehype-auto-ads plugin.
 */
export interface RehypeAutoAdsOptions {
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
type RehypeAutoAdsFullOptions = Required<RehypeAutoAdsOptions>;

const EXCLUDE_TARGETS = {
    tagNames: ["aside", "blockquote", "ul", "ol", "li"]
};

/**
 * rehype.js plugin that automatically inserts Google Adsense (and theoretically any ad service) code.
 *
 * This plugin inserts an ad code for each specified number of paragraphs. For example, insert Google Adsense display ad code every 5 paragraphs.
 */
const rehypeAutoAds: Plugin<[RehypeAutoAdsOptions], Root> = (args: RehypeAutoAdsOptions) => {
    const defaultOptions = {
        countFrom: 0,
        paragraphInterval: 5
    };

    const options: RehypeAutoAdsFullOptions = {
        ...defaultOptions,
        ...args
    };

    const adCodeHast = fromHtml(options.adCode, { fragment: true }).children as ElementContent[];

    const transform: Transformer<Root> = (tree) => {
        let paragraphCount = options.countFrom || 0;

        visitParents<Root, string>(tree, "element", (node, ancestors) => {
            if (!isElement(node)) return;

            if (node.tagName === "p") {
                paragraphCount++;
            }

            const skipNode = ancestors.some((ancestor) => {
                return isElement(ancestor) && EXCLUDE_TARGETS.tagNames.includes(ancestor.tagName);
            });

            if (skipNode) return;

            if (paragraphCount >= options.paragraphInterval) {
                paragraphCount = 0;

                const ad = structuredClone(adCodeHast);

                if (ancestors.length === 0) return;

                const parent = ancestors[ancestors.length - 1];
                if (!parent.children) return;
                const index = parent.children.indexOf(node);

                if (index >= 0) {
                    parent.children.splice(index + 1, 0, ...ad);
                }
            }
        });
    };

    return transform;
};

export default rehypeAutoAds;
