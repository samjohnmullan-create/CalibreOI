import { isResaleItem } from "./item-model.js?v=5";

const num=v=>Number(v)||0;
const DIRECT_COST_KEYS=["purchasePrice","buyerPremium","postage","preparationCost","repairCost","partsCost","consumables","externalService","marketplaceFees","shippingToBuyer","otherCost"];

export function commercialOf(item){return item?.commercial&&typeof item.commercial==="object"?item.commercial:{};}
export function itemDirectCost(item){const c=commercialOf(item);return DIRECT_COST_KEYS.reduce((n,k)=>n+num(c[k]),0);}
export function itemLabourCost(item){const c=commercialOf(item);return num(c.labourMinutes)/60*num(c.labourRate);}
export function itemSaleValue(item,key="actualSale"){const c=commercialOf(item);if(key==="actualSale")return num(c.actualSale);if(key==="targetSale")return num(c.targetSale);if(key==="minSale")return num(c.minSale);return num(c[key]);}
export function itemIsSold(item){return item?.status==="Sold"||itemSaleValue(item,"actualSale")>0;}
export function itemEconomics(item,{saleKey}={}){
 const sold=itemIsSold(item),key=saleKey||(sold?"actualSale":"targetSale"),cost=itemDirectCost(item),sale=itemSaleValue(item,key),labour=itemLabourCost(item),profit=sale-cost,afterLabour=profit-labour;
 return {cost,sale,profit,labour,afterLabour,roi:cost?profit/cost:0,afterLabourRoi:cost?afterLabour/cost:0,sold,saleKey:key};
}
export function resaleItems(stateItems=[]){return (Array.isArray(stateItems)?stateItems:[]).filter(isResaleItem);}
export function soldCost(items=[]){return items.filter(itemIsSold).reduce((n,item)=>n+itemDirectCost(item),0);}
export function totals(items=[],options={}){return items.reduce((out,item)=>{const e=itemEconomics(item,options);out.cost+=e.cost;out.sale+=e.sale;out.profit+=e.profit;out.labour+=e.labour;out.afterLabour+=e.afterLabour;return out;},{cost:0,sale:0,profit:0,labour:0,afterLabour:0});}
