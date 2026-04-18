import { create } from "zustand";

// export const useStore = create((set) => ({
//   bears: 0,
//   increasePopulation: () =>
//     set((state: { bears: number }) => ({ bears: state.bears + 1 })),
//   removeAllBears: () => set({ bears: 0 }),
//   updateBears: (newBears: any) => set({ bears: newBears }),
// }));
export const useStore = create((set) => ({
  organization: {},
  updateOrganization: (newOrganization: any) =>
    set({ organization: newOrganization }),
}));
