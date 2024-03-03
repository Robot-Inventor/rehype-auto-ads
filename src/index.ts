import { visitParents } from "unist-util-visit-parents";
import type { Plugin, Transformer } from "unified";
import type { Node } from "unist";
import type { Root } from "mdast";

export interface RemarkAutoAdsOptions {
    adCode: string;
    countFrom?: number;
    paragraphInterval?: number;
}

type RemarkAutoAdsFullOptions = Required<RemarkAutoAdsOptions>;

type RemarkPlugin = Plugin<RemarkAutoAdsOptions[], Root>;

declare module "unist" {
    interface Data {
        hName?: string;
    }

    interface Node {
        children?: Node[];
    }
}

const remarkAutoAds: RemarkPlugin = (args: RemarkAutoAdsOptions) => {
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
