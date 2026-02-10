import { useState } from "react";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  LogOut,
  FlaskConical,
  Loader2,
  Signal,
  SignalHigh,
  SignalLow,
  SignalZero,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { NavigationPane } from "./navigation-pane";
import { cn } from "../lib/utils";
import {
  API_ENDPOINTS,
  getApiUrl,
  getAuthHeaders,
} from "../../config/api";

interface LabsPageProps {
  onLogout: () => void;
  userName: string;
  onSelectSet: (
    labId: string,
    labNumber: number,
    cabinetId: string,
    manufacture: string,
    variant: string,
    deviceInfo: DeviceInfo[],
  ) => void;
  onNavigateToDashboard: () => void;
  onNavigate: (page: "dashboard" | "labs" | "admin") => void;
}

// Type definitions for API responses
interface Lab {
  lab_id: string;
  lab_name: string;
  number: number;
}

// Cabinet data from API with device state for color coding
interface CabinetData {
  cabinet_id: string;
  ch_type: string | null;
  ch_variant: string | null;
  lab_id: string;
  is_active: string; // "true" or "false" as string
  device_state?: string; // From LLS inventory for color coding
  has_commissioned_device?: boolean; // Derived field for green status
}

// LLS Inventory types
interface MeterDevice {
  asset_no: string;
  device_state: string;
  device_type: string;
  commission_status: string;
  manufacturer?: string;
  guid?: string;
  device_model?: string;
  // ... other fields from the API response
}

interface LLSCabinetInventory {
  cabinet_id: string;
  ch_type: string | null;
  ch_variant?: string | null; // Added to support variant from LLS
  host_ip: string;
  host_name: string;
  is_active: boolean;
  lab_id: string;
  lls_status?: string;
  meter_set: MeterDevice[];
}

// Device information to pass to Set Details page
export interface DeviceInfo {
  device_type: string;
  manufacturer: string;
  guid: string;
  device_state: string;
  device_model: string;
  host_name: string;
  host_ip: string;
}

interface Manufacture {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  name: string;
}

// Signal strength types
type SignalStrength = "full" | "medium" | "none";

interface Set {
  id: string;
  name: string;
  number: number;
  manufacture: string;
  variant: string;
  signalStrength: SignalStrength; // Green = full, Yellow = medium, Red = none
  cabinet_id?: string; // Link to cabinet information
}

interface LabDetailsResponse {
  manufactures: Manufacture[];
  variants: Variant[];
  sets: Set[];
}

export function LabsPage({
  onLogout,
  userName,
  onSelectSet,
  onNavigateToDashboard,
  onNavigate,
}: LabsPageProps) {
  const [selectedLab, setSelectedLab] = useState<string>("");
  const [selectedManufacture, setSelectedManufacture] =
    useState<string>("");
  const [selectedVariant, setSelectedVariant] =
    useState<string>("");
  const [selectedSet, setSelectedSet] = useState<number | null>(
    null,
  );
  const [selectedCabinetId, setSelectedCabinetId] =
    useState<string>("");

  // Dynamic data from API
  const [labs, setLabs] = useState<Lab[]>([]);
  const [cabinetData, setCabinetData] = useState<CabinetData[]>(
    [],
  );
  const [chManufactures, setChManufactures] = useState<
    Manufacture[]
  >([]);
  const [chVariants, setChVariants] = useState<Variant[]>([]);
  const [allSets, setAllSets] = useState<Set[]>([]);
  
  // Store device information from LLS_INVENTORY for each cabinet
  const [deviceInfoMap, setDeviceInfoMap] = useState<Map<string, DeviceInfo[]>>(new Map());

  // Loading states
  const [isLoadingLabs, setIsLoadingLabs] = useState(true);
  const [isLoadingLabDetails, setIsLoadingLabDetails] =
    useState(false);
  const [isLoadingSets, setIsLoadingSets] = useState(false);

  // Get authentication token from storage
  const getAuthToken = (): string | null => {
    return (
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken")
    );
  };

  /**
   * Fetch list of labs when component mounts
   */
  useEffect(() => {
    fetchLabs();
  }, []);

  /**
   * Fetch labs from API
   */
  const fetchLabs = async () => {
    setIsLoadingLabs(true);

    try {
      const token = getAuthToken();

      if (!token) {
        toast.error(
          "Authentication token not found. Please login again.",
        );
        setIsLoadingLabs(false);
        return;
      }

      const labsUrl = getApiUrl(API_ENDPOINTS.LABS);
      console.log("🚀 API Call - GET LABS:", {
        url: labsUrl,
        method: "GET",
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(labsUrl, {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      console.log("✅ API Response - GET LABS:", {
        url: labsUrl,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString(),
      });

      // Check if response is JSON by checking content-type header
      const contentType = response.headers.get("content-type");
      const isJson =
        contentType && contentType.includes("application/json");

      // Handle specific error codes
      if (response.status === 401) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              errorData.detail ||
              "Unauthorized - Please login again",
          );
        }
        throw new Error("Invalid or missing token");
      }

      if (response.status === 404) {
        throw new Error(
          "Labs endpoint not found. Please check your API configuration.",
        );
      }

      if (response.status >= 500 || response.status === 400) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail ||
              errorData.message ||
              "API error occurred",
          );
        }
        throw new Error(
          "Server error occurred. Please try again later.",
        );
      }

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              errorData.detail ||
              "Failed to fetch labs",
          );
        }
        throw new Error(
          `Failed to fetch labs (Status: ${response.status})`,
        );
      }

      // Only try to parse JSON if content-type is JSON
      if (!isJson) {
        throw new Error(
          "Invalid response from server. Expected JSON but received HTML.",
        );
      }

      const data = await response.json();

      // Expected JSON format:
      // [
      //   { "lab_id": "andromada", "lab_name": "andromada" },
      //   { "lab_id": "andromada12", "lab_name": "andromada12" },
      //   ...
      // ]

      // Map the response to include a number field
      const mappedLabs = data.map(
        (
          lab: { lab_id: string; lab_name: string },
          index: number,
        ) => ({
          lab_id: lab.lab_id,
          lab_name: lab.lab_name,
          number: index + 1,
        }),
      );

      setLabs(mappedLabs);
      toast.success("Labs loaded successfully");
    } catch (error) {
      console.error("Error fetching labs:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load labs";
      toast.error(errorMessage);
      setLabs([]);
    } finally {
      setIsLoadingLabs(false);
    }
  };

  /**
   * Fetch lab details (cabinet data) when lab is selected
   * Uses LLS_INVENTORY to get device_state for color coding
   */
  const fetchLabDetails = async (
    labId: string,
    labNumber: number,
  ) => {
    setIsLoadingLabDetails(true);
    setCabinetData([]); // Clear previous data
    setChManufactures([]); // Clear previous manufactures
    setChVariants([]); // Clear previous variants

    // Real API call - Fetch LLS inventory
    try {
      const token = getAuthToken();

      if (!token) {
        toast.error(
          "Authentication token not found. Please login again.",
        );
        setIsLoadingLabDetails(false);
        return;
      }

      const llsUrl = getApiUrl(API_ENDPOINTS.LLS_INVENTORY);
      const llsBody = {
        lab_id: labId,
        with_meter_set_inventory: true,
      };

      console.log("🚀 API Call - POST LLS_INVENTORY:", {
        url: llsUrl,
        method: "POST",
        body: llsBody,
        timestamp: new Date().toISOString(),
      });

      const llsResponse = await fetch(llsUrl, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(llsBody),
      });

      console.log("✅ API Response - POST LLS_INVENTORY:", {
        url: llsUrl,
        status: llsResponse.status,
        statusText: llsResponse.statusText,
        timestamp: new Date().toISOString(),
      });

      const llsContentType =
        llsResponse.headers.get("content-type");
      const llsIsJson =
        llsContentType &&
        llsContentType.includes("application/json");

      // Handle specific error codes
      if (llsResponse.status === 401) {
        throw new Error("Unauthorized - Please login again");
      }

      if (llsResponse.status === 404) {
        throw new Error(
          "LLS Inventory endpoint not found. Please check your API configuration.",
        );
      }

      if (llsResponse.status >= 500) {
        throw new Error("Server error occurred. Please try again later.");
      }

      if (!llsResponse.ok) {
        throw new Error(
          `Failed to fetch LLS inventory (Status: ${llsResponse.status})`,
        );
      }

      if (!llsIsJson) {
        throw new Error(
          "Invalid response from server. Expected JSON but received HTML.",
        );
      }

      const llsData: LLSCabinetInventory[] = await llsResponse.json();

      // Extract device information from meter_set for each cabinet
      const newDeviceInfoMap = new Map<string, DeviceInfo[]>();
      
      llsData.forEach((lls) => {
        const devices: DeviceInfo[] = [];
        
        // Extract device information from meter_set
        if (lls.meter_set && lls.meter_set.length > 0) {
          lls.meter_set.forEach((device) => {
            devices.push({
              device_type: device.device_type || "",
              manufacturer: device.manufacturer || "",
              guid: device.guid || "",
              device_state: device.device_state || "",
              device_model: device.device_model || "",
              host_name: lls.host_name,
              host_ip: lls.host_ip,
            });
          });
        }
        
        // Store devices for this cabinet
        newDeviceInfoMap.set(lls.cabinet_id, devices);
      });
      
      setDeviceInfoMap(newDeviceInfoMap);
      
      console.log("🔧 Device Info Extraction Debug:", {
        totalCabinets: llsData.length,
        devicesExtracted: Array.from(newDeviceInfoMap.entries()).map(([cabinetId, devices]) => ({
          cabinetId,
          deviceCount: devices.length,
          deviceTypes: devices.map(d => d.device_type),
        })),
        timestamp: new Date().toISOString(),
      });

      // Transform LLS data to CabinetData format
      const transformedCabinetData: CabinetData[] = llsData.map(
        (lls) => {
          // Check if any device in meter_set is commissioned
          const hasCommissionedDevice =
            lls.meter_set?.some(
              (device) =>
                device.device_state?.toLowerCase() === "commissioned",
            ) || false;

          // Get first device state or null
          const deviceState = lls.meter_set?.[0]?.device_state || null;

          return {
            cabinet_id: lls.cabinet_id,
            ch_type: lls.ch_type,
            ch_variant: lls.ch_variant || null,
            lab_id: lls.lab_id,
            is_active: lls.is_active ? "true" : "false",
            device_state: deviceState,
            has_commissioned_device: hasCommissionedDevice,
          };
        },
      );

      setCabinetData(transformedCabinetData);

      // Extract unique manufacturers from cabinet data
      const uniqueManufactures = Array.from(
        new Set(
          transformedCabinetData
            .map((cabinet) => cabinet.ch_type)
            .filter((ch_type) => ch_type !== null),
        ),
      ) as string[];

      const manufacturesList = uniqueManufactures.map(
        (ch_type) => ({
          id: ch_type,
          name: ch_type.toUpperCase(),
        }),
      );

      setChManufactures(manufacturesList);

      // Extract unique variants from cabinet data
      const uniqueVariants = Array.from(
        new Set(
          transformedCabinetData
            .map((cabinet) => cabinet.ch_variant)
            .filter((ch_variant) => ch_variant !== null),
        ),
      ) as string[];

      console.log("📊 Variant Extraction Debug:", {
        transformedCabinetData: transformedCabinetData,
        allChVariants: transformedCabinetData.map(c => c.ch_variant),
        uniqueVariants: uniqueVariants,
        timestamp: new Date().toISOString(),
      });

      const variantsList = uniqueVariants.map((ch_variant) => ({
        id: ch_variant,
        name: ch_variant.toUpperCase(),
      }));

      setChVariants(variantsList);
      
      console.log("📊 Variants Set:", {
        variantsList: variantsList,
        count: variantsList.length,
        timestamp: new Date().toISOString(),
      });
      
      // Generate sets from cabinet data
      const generatedSets: Set[] = transformedCabinetData.map((cabinet, index) => ({
        id: `${cabinet.cabinet_id}-${cabinet.ch_type}`,
        name: cabinet.cabinet_id,
        number: index + 1,
        manufacture: cabinet.ch_type || "",
        variant: cabinet.ch_variant || "",
        signalStrength: cabinet.has_commissioned_device ? "full" : cabinet.is_active === "true" ? "medium" : "none",
        cabinet_id: cabinet.cabinet_id,
      }));
      
      setAllSets(generatedSets);
      toast.success(`Lab details loaded successfully`);
    } catch (error) {
      console.error("Error fetching lab details:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load lab details";
      toast.error(errorMessage);
      setCabinetData([]);
      setChManufactures([]);
      setChVariants([]);
    } finally {
      setIsLoadingLabDetails(false);
    }
  };

  // Filter sets based on selections
  const getFilteredSets = () => {
    let filtered = allSets;

    // Filter by manufacture if selected
    if (selectedManufacture) {
      filtered = filtered.filter(
        (set) => set.manufacture === selectedManufacture,
      );
    }

    // Filter by variant if selected
    if (selectedVariant) {
      filtered = filtered.filter(
        (set) => set.variant === selectedVariant,
      );
    }

    return filtered;
  };

  // Filter variants based on selected manufacturer
  const getFilteredVariants = () => {
    if (!selectedManufacture) {
      return chVariants;
    }

    // Get unique variants for the selected manufacturer
    const variantsForManufacturer = Array.from(
      new Set(
        allSets
          .filter((set) => set.manufacture === selectedManufacture)
          .map((set) => set.variant)
          .filter((variant) => variant !== "")
      )
    );

    return chVariants.filter((variant) => 
      variantsForManufacturer.includes(variant.id)
    );
  };

  // Filter cabinets based on manufacture selection
  const getFilteredCabinets = () => {
    let filtered = cabinetData;

    // Filter by manufacture if selected
    if (selectedManufacture) {
      filtered = filtered.filter(
        (cabinet) => cabinet.ch_type === selectedManufacture,
      );
    }

    return filtered;
  };

  const sets = getFilteredSets();
  const filteredVariants = getFilteredVariants();
  const filteredCabinets = getFilteredCabinets();

  const handleLabChange = (value: string) => {
    setSelectedLab(value);
    setSelectedManufacture(""); // Reset manufacture when lab changes
    setSelectedVariant(""); // Reset variant when lab changes
    setSelectedSet(null); // Reset set selection when lab changes
    setSelectedCabinetId(""); // Reset cabinet selection when lab changes
    const lab = labs.find((l) => l.lab_id === value);
    if (lab) {
      fetchLabDetails(value, lab.number);
    }
  };

  const handleManufactureChange = (value: string) => {
    setSelectedManufacture(value);
    setSelectedVariant(""); // Reset variant when manufacture changes
    setSelectedSet(null); // Reset set selection when manufacture changes
  };

  const handleVariantChange = (value: string) => {
    setSelectedVariant(value);
    setSelectedSet(null); // Reset set selection when variant changes
  };

  const handleSetClick = (setNumber: number) => {
    setSelectedSet(setNumber);
  };

  const handleCabinetClick = (cabinetId: string) => {
    setSelectedCabinetId(cabinetId);

    toast.success(`Cabinet ${cabinetId} selected`);
  };

  const handleOpenSet = () => {
    const lab = labs.find((l) => l.lab_id === selectedLab);
    const set = sets.find((s) => s.number === selectedSet);

    if (lab && set) {
      // Use cabinet_id from the set, or fallback to selectedCabinetId
      const cabinetId = set.cabinet_id || selectedCabinetId;
      
      // Get device information for this cabinet
      const devices = deviceInfoMap.get(cabinetId) || [];
      
      console.log("🚀 Opening Set Details with Device Info:", {
        cabinetId: cabinetId,
        deviceCount: devices.length,
        devices: devices,
        timestamp: new Date().toISOString(),
      });
      
      onSelectSet(
        lab.lab_id,
        lab.number,
        cabinetId,
        set.manufacture,
        set.variant,
        devices,
      );
    }
  };

  return (
    <>
      {/* Navigation Pane */}
      <NavigationPane
        currentPage="labs"
        userName={userName}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* Main Content with margin for navigation */}
      <div className="ml-[156px] transition-all duration-300">
        <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          {/* Common Header */}
          <div className="fixed top-0 left-[156px] right-4 bg-white shadow-md z-10 py-3 rounded-br-lg">
            <div className="max-w-7xl mx-auto px-4">
              <h1 className="font-semibold text-center">
                Automated Logging Solution
              </h1>
              <p className="text-sm text-gray-600 text-center">
                Smart Lab selection
              </p>
            </div>
          </div>

          {/* User Info and Logout */}
          <div className="max-w-4xl mx-auto mb-6 mt-20">
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <FlaskConical className="size-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">
                    Welcome, {userName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Select Laboratory and Set</CardTitle>
                <CardDescription>
                  {isLoadingLabs
                    ? "Loading laboratories..."
                    : `Choose from ${labs.length} available lab${labs.length !== 1 ? "s" : ""} and their corresponding sets`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lab Selection */}
                <div className="space-y-2">
                  <Label htmlFor="lab-select">Laboratory</Label>
                  <Select
                    value={selectedLab}
                    onValueChange={handleLabChange}
                    disabled={isLoadingLabs}
                  >
                    <SelectTrigger id="lab-select">
                      {isLoadingLabs ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          <span>Loading labs...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select a lab" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {labs.map((lab) => (
                        <SelectItem
                          key={lab.lab_id}
                          value={lab.lab_id}
                        >
                          {lab.lab_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Manufacture Selection - Only show when lab is selected */}
                {selectedLab && (
                  <div className="space-y-2">
                    <Label htmlFor="manufacture-select">
                      Manufacture
                    </Label>
                    <Select
                      value={selectedManufacture}
                      onValueChange={handleManufactureChange}
                      disabled={isLoadingLabDetails}
                    >
                      <SelectTrigger id="manufacture-select">
                        {isLoadingLabDetails ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            <span>Loading manufactures...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select a manufacture" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {chManufactures.map((manufacture) => (
                          <SelectItem
                            key={manufacture.id}
                            value={manufacture.id}
                          >
                            {manufacture.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Variant Selection - Only show when manufacture is selected */}
                {selectedManufacture && (
                  <div className="space-y-2">
                    <Label htmlFor="variant-select">
                      Variant
                    </Label>
                    <Select
                      value={selectedVariant}
                      onValueChange={handleVariantChange}
                      disabled={isLoadingLabDetails}
                    >
                      <SelectTrigger id="variant-select">
                        {isLoadingLabDetails ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            <span>Loading variants...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select a variant" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {filteredVariants.map((variant) => (
                          <SelectItem
                            key={variant.id}
                            value={variant.id}
                          >
                            {variant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Set Selection - Only show when lab is selected */}
                {selectedLab && (
                  <div className="space-y-3">
                    <Label>
                      Select Set{" "}
                      {selectedManufacture &&
                        `(Filtered by ${chManufactures.find((m) => m.id === selectedManufacture)?.name})`}{" "}
                      {selectedVariant &&
                        `(${chVariants.find((v) => v.id === selectedVariant)?.name})`}
                    </Label>

                    {/* Color Legend */}
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-md border">
                      <span className="text-xs font-medium text-gray-600">
                        Status:
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300"></div>
                        <span className="text-xs text-gray-700">
                          Commissioned
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300"></div>
                        <span className="text-xs text-gray-700">
                          Not Commissioned
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-200 border-2 border-gray-400"></div>
                        <span className="text-xs text-gray-700">
                          Inactive
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                      {sets.map((set) => {
                        // Get cabinet information for this set
                        const cabinetInfo = set.cabinet_id
                          ? cabinetData.find(
                              (c) =>
                                c.cabinet_id ===
                                  set.cabinet_id &&
                                c.ch_type === set.manufacture,
                            )
                          : null;

                        // Determine background color based on cabinet status
                        const getStatusColor = () => {
                          if (!cabinetInfo) {
                            // Fallback to original signal strength
                            if (set.signalStrength === "full")
                              return "bg-green-100 border-green-300 hover:bg-green-200";
                            if (set.signalStrength === "medium")
                              return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200";
                            return "bg-red-100 border-red-300 hover:bg-red-200";
                          }

                          // Green: device_state === "Commissioned" AND is_active === true
                          if (
                            cabinetInfo.is_active === "true" &&
                            cabinetInfo.has_commissioned_device
                          ) {
                            return "bg-green-100 border-green-300 hover:bg-green-200";
                          }
                          // Orange/Yellow: device_state !== "Commissioned" AND is_active === true
                          if (
                            cabinetInfo.is_active === "true" &&
                            !cabinetInfo.has_commissioned_device
                          ) {
                            return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200";
                          }
                          // Gray/Red: is_active === false
                          return "bg-gray-200 border-gray-400 hover:bg-gray-300";
                        };

                        const statusColor = getStatusColor();

                        return (
                          <button
                            key={set.id}
                            onClick={() =>
                              handleSetClick(set.number)
                            }
                            className={`p-3 rounded-md border-2 transition-all hover:shadow-md flex flex-col items-center justify-center gap-2 ${
                              selectedSet === set.number
                                ? "border-blue-600 bg-blue-600 text-white"
                                : `${statusColor} text-gray-700`
                            }`}
                          >
                            {/* Display Cabinet ID if available, otherwise Set Number */}
                            {cabinetInfo ? (
                              <>
                                <span className="text-sm font-bold">
                                  {cabinetInfo.cabinet_id}
                                </span>
                                <span className="text-xs uppercase font-medium">
                                  {cabinetInfo.ch_type ||
                                    set.manufacture}
                                </span>
                                {cabinetInfo.ch_variant && (
                                  <span className="text-xs opacity-75">
                                    {cabinetInfo.ch_variant}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-sm font-semibold">
                                Set {set.number}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500">
                      {selectedManufacture || selectedVariant
                        ? `Showing ${sets.length} filtered set(s). Click to select.`
                        : `Showing all ${sets.length} sets. Click to select.`}
                    </p>
                  </div>
                )}

                {/* Selection Summary */}
                {selectedLab && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold mb-3">
                      Current Selection
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Lab:
                        </span>
                        <Badge variant="default">
                          {
                            labs.find(
                              (l) => l.lab_id === selectedLab,
                            )?.lab_name
                          }
                        </Badge>
                      </div>
                      {selectedManufacture && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Manufacture:
                          </span>
                          <Badge variant="secondary">
                            {
                              chManufactures.find(
                                (m) =>
                                  m.id === selectedManufacture,
                              )?.name
                            }
                          </Badge>
                        </div>
                      )}
                      {selectedVariant && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Variant:
                          </span>
                          <Badge variant="secondary">
                            {
                              chVariants.find(
                                (v) => v.id === selectedVariant,
                              )?.name
                            }
                          </Badge>
                        </div>
                      )}
                      {selectedSet && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Cabinet ID:
                          </span>
                          <Badge variant="secondary">
                            {(() => {
                              const set = sets.find(
                                (s) => s.number === selectedSet,
                              );
                              const cabinetInfo =
                                set?.cabinet_id
                                  ? cabinetData.find(
                                      (c) =>
                                        c.cabinet_id ===
                                          set.cabinet_id &&
                                        c.ch_type ===
                                          set.manufacture,
                                    )
                                  : null;
                              return (
                                cabinetInfo?.cabinet_id?.toUpperCase() ||
                                set?.cabinet_id?.toUpperCase() ||
                                `Set ${selectedSet}`
                              );
                            })()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={handleOpenSet}
                  className="w-full"
                  size="lg"
                  disabled={!selectedSet}
                >
                  Open Selected Set
                </Button>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <p className="text-sm text-gray-600">
                    Copyright © 2025. All rights reserved.
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-sm text-gray-600">
                    Contact us:{" "}
                    <a
                      href="mailto:support@gmail.com"
                      className="text-blue-600 hover:underline"
                    >
                      support@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}